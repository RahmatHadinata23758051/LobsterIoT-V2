<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Services\InfluxDBService;
use App\Services\CalibrationService;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use Illuminate\Support\Facades\Log;

#[Signature('mqtt:subscribe {topic=lobsense/telemetry/#}')]
#[Description('Subscribe to MQTT broker and ingest telemetry data to InfluxDB')]
class MqttSubscribeCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(InfluxDBService $influxDB, CalibrationService $calibration)
    {
        $topic = $this->argument('topic');
        $server = config('mqtt.host', '127.0.0.1');
        $port = config('mqtt.port', 1883);
        $clientId = 'lobsense_backend_' . uniqid();
        $username = config('mqtt.username');
        $password = config('mqtt.password');

        $connectionSettings = (new ConnectionSettings())
            ->setKeepAliveInterval(60);

        if (!empty($username) && trim($username) !== '') {
            $connectionSettings = $connectionSettings->setUsername($username);
        }
        if (!empty($password)) {
            $connectionSettings = $connectionSettings->setPassword($password);
        }

        // Enable TLS if using port 8883
        if ($port === 8883) {
            $connectionSettings->setUseTls(true)
                               ->setTlsVerifyPeer(false);
        }

        try {
            $this->info("Connecting to MQTT broker at {$server}:{$port}...");
            $mqtt = new MqttClient($server, $port, $clientId);
            
            $mqtt->connect($connectionSettings, true);
            $this->info("Connected successfully. Subscribing to topic [{$topic}]...");

            $topics = ['lobsense/telemetry', 'lobsense/telemetry/#'];
            foreach ($topics as $t) {
                $mqtt->subscribe($t, function (string $topic, string $message) use ($influxDB, $calibration) {
                    $this->info("[Raw MQTT Message] " . $message);
                    
                    $data = json_decode($message, true);
                    if (!$data) {
                        $this->warn("Received non-JSON payload: " . $message);
                        return;
                    }

                    $this->processTelemetry($data, $influxDB, $calibration);
                }, 0);
            }

            $mqtt->loop(true);
        } catch (\Exception $e) {
            $this->error("MQTT Subscriber Error: " . $e->getMessage());
            Log::error("MQTT Subscriber Error: " . $e->getMessage(), [
                'exception' => $e
            ]);
            return 1;
        }

        return 0;
    }

    /**
     * Process and ingest telemetry packet.
     */
    protected function processTelemetry(array $data, InfluxDBService $influxDB, CalibrationService $calibration): void
    {
        $serialNumber = $data['serial_number'] ?? null;
        if (!$serialNumber) {
            $this->error("Missing serial_number in payload.");
            return;
        }

        $timestamp = time();
        if (isset($data['timestamp'])) {
            if (is_numeric($data['timestamp'])) {
                $timestamp = (int) $data['timestamp'];
            } else {
                $parsedTime = strtotime($data['timestamp']);
                if ($parsedTime !== false && $parsedTime > 0) {
                    $timestamp = $parsedTime;
                }
            }
        }
        
        // Support both nested raw_values and flat structures
        $rawValues = $data['raw_values'] ?? null;
        if (!is_array($rawValues)) {
            // Filter out system attributes to get flat raw values
            $rawValues = array_diff_key($data, array_flip(['serial_number', 'timestamp', 'cage_code', 'latitude', 'longitude']));
        }

        if (empty($rawValues)) {
            $this->warn("No telemetry fields found in packet.");
            return;
        }

        // Calibrate raw values
        $calibratedValues = $calibration->calibrate($serialNumber, $rawValues);

        // Resolve cage code (passed in payload, or fallback)
        $cageCode = $data['cage_code'] ?? 'CAGE-DEFAULT';

        // Additional physical fields that might be passed (e.g. coordinates, pitch, roll, yaw)
        $coordinateFields = [];
        foreach (['latitude', 'longitude', 'altitude', 'pitch', 'roll', 'yaw'] as $geoKey) {
            if (isset($data[$geoKey])) {
                $coordinateFields[$geoKey] = (float) $data[$geoKey];
            } elseif (isset($rawValues[$geoKey])) {
                $coordinateFields[$geoKey] = (float) $rawValues[$geoKey];
            }
        }

        // 1. Write to raw_telemetries
        try {
            $rawFields = array_filter($rawValues, fn($v) => is_numeric($v));
            $influxDB->writePoint(
                'raw_telemetries',
                ['iot_node_serial_number' => $serialNumber],
                $rawFields,
                $timestamp
            );
            $this->info("Successfully wrote raw_telemetries for {$serialNumber} to TSDB.");
        } catch (\Exception $e) {
            $this->error("Failed writing raw_telemetries to InfluxDB: " . $e->getMessage());
        }

        // 2. Write to calibrated telemetries
        try {
            // Map raw names to calibrated telemetry names if they differ
            // (e.g. ambient_temperature, water_temperature, ph, tds, dissolved_oxygen, turbidity, salinity, flow_rate)
            $calibratedFields = [];
            
            // Map temperature keys
            if (isset($calibratedValues['water_temperature'])) {
                $calibratedFields['water_temperature'] = $calibratedValues['water_temperature'];
            } elseif (isset($calibratedValues['temperature_node'])) {
                $calibratedFields['water_temperature'] = $calibratedValues['temperature_node']; // fallback
            }

            if (isset($calibratedValues['ambient_temperature'])) {
                $calibratedFields['ambient_temperature'] = $calibratedValues['ambient_temperature'];
            }

            // Map pH, TDS, DO, Turbidity, Salinity, Flow Rate
            foreach (['ph', 'tds', 'dissolved_oxygen', 'turbidity', 'salinity', 'flow_rate'] as $metric) {
                if (isset($calibratedValues[$metric])) {
                    $calibratedFields[$metric] = $calibratedValues[$metric];
                } elseif ($metric === 'dissolved_oxygen' && isset($calibratedValues['raw_dissolved_oxygen'])) {
                    $calibratedFields['dissolved_oxygen'] = $calibratedValues['raw_dissolved_oxygen'];
                }
            }

            // Merge coordinate fields
            $calibratedFields = array_merge($calibratedFields, $coordinateFields);

            if (!empty($calibratedFields)) {
                $influxDB->writePoint(
                    'telemetries',
                    [
                        'iot_node_serial_number' => $serialNumber,
                        'cage_code' => $cageCode
                    ],
                    $calibratedFields,
                    $timestamp
                );
                $this->info("Successfully wrote calibrated telemetries for {$serialNumber} to TSDB.");
            }
        } catch (\Exception $e) {
            $this->error("Failed writing calibrated telemetries to InfluxDB: " . $e->getMessage());
        }
    }
}
