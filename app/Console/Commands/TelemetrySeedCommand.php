<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\InfluxDBService;
use App\Models\IotNode;
use App\Models\Threshold;
use App\Models\City;
use App\Models\User;

class TelemetrySeedCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telemetry:seed {serial_number=NODE-99081}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed local InfluxDB and PostgreSQL with dummy telemetry data for testing';

    /**
     * Execute the console command.
     */
    public function handle(InfluxDBService $influxDB)
    {
        $serialNumber = $this->argument('serial_number');
        
        // 1. Ensure the node exists and is activated in PostgreSQL
        $node = IotNode::where('serial_number', $serialNumber)->first();
        if (!$node) {
            $this->info("IoT Node [{$serialNumber}] not found in PostgreSQL. Creating it automatically...");
            
            $city = City::first();
            $user = User::where('role', 'operator')->first() ?? User::first();
            
            if (!$city || !$user) {
                $this->error("Cannot auto-create IoT Node: No cities or users found in database. Run 'php artisan db:seed' first!");
                return 1;
            }
            
            $node = IotNode::create([
                'city_id' => $city->id,
                'owner_id' => $user->id,
                'serial_number' => $serialNumber,
                'ip_address' => '192.168.1.100',
                'latitude' => -7.693236,
                'longitude' => 108.662284,
                'activated_at' => now(),
                'activated_by' => $user->id,
                'installed_at' => now(),
            ]);

            $this->info("Created IoT Node [{$serialNumber}].");

            // Seed default thresholds
            $sensors = ['ph', 'tds', 'water_temperature', 'dissolved_oxygen', 'turbidity', 'flow_rate'];
            $defaultRanges = [
                'ph' => [6.5, 8.5],
                'tds' => [150.0, 400.0],
                'water_temperature' => [24.0, 30.0],
                'dissolved_oxygen' => [5.0, 10.0],
                'turbidity' => [0.0, 25.0],
                'flow_rate' => [0.1, 1.0],
            ];

            foreach ($sensors as $sensor) {
                Threshold::create([
                    'iot_node_serial_number' => $serialNumber,
                    'sensor_code' => $sensor,
                    'value_min' => $defaultRanges[$sensor][0],
                    'value_max' => $defaultRanges[$sensor][1],
                    'offset_value' => 0.0,
                ]);
            }
            $this->info("Created default thresholds for [{$serialNumber}].");
        } else {
            // If it exists, ensure it is activated so it shows up in active list
            if (is_null($node->activated_at)) {
                $node->update(['activated_at' => now()]);
                $this->info("Activated existing IoT Node [{$serialNumber}].");
            }
        }

        $this->info("Seeding dummy telemetry data for serial number: [{$serialNumber}]...");

        $now = time();
        $intervals = 288; // 24 hours in 5-minute intervals (24 * 12)
        $pointsSeeded = 0;

        for ($i = $intervals; $i >= 0; $i--) {
            $timestamp = $now - ($i * 300); // 5 minutes (300 seconds) ago

            // Generate realistic values with slight variations using sine functions
            $angle = ($i / $intervals) * 2 * M_PI;
            
            $waterTemp = 26.5 + sin($angle) * 1.5 + rand(-2, 2) / 10;
            $ambientTemp = 29.0 + sin($angle) * 2.0 + rand(-3, 3) / 10;
            $ph = 7.3 + cos($angle) * 0.3 + rand(-1, 1) / 10;
            $tds = 250.0 + sin($angle) * 15.0 + rand(-5, 5);
            $dissolvedOxygen = 5.8 + cos($angle) * 0.6 + rand(-2, 2) / 10;
            $turbidity = 12.0 + sin($angle) * 3.0 + rand(-1, 1);
            $flowRate = 0.35 + sin($angle * 2) * 0.05 + rand(-1, 1) / 100;
            $pitch = 0.5 + sin($angle) * 0.2;
            $roll = -1.0 + cos($angle) * 0.3;
            $yaw = 180.0 + sin($angle * 0.5) * 5.0;

            $fields = [
                'water_temperature' => round($waterTemp, 2),
                'ambient_temperature' => round($ambientTemp, 2),
                'ph' => round($ph, 2),
                'tds' => round($tds, 2),
                'dissolved_oxygen' => round($dissolvedOxygen, 2),
                'turbidity' => round($turbidity, 2),
                'flow_rate' => round($flowRate, 3),
                'pitch' => round($pitch, 2),
                'roll' => round($roll, 2),
                'yaw' => round($yaw, 2),
                'latitude' => -7.693236,
                'longitude' => 108.662284
            ];

            try {
                $influxDB->writePoint(
                    'telemetries',
                    [
                        'iot_node_serial_number' => $serialNumber,
                        'cage_code' => 'CAGE-001'
                    ],
                    $fields,
                    $timestamp
                );
                $pointsSeeded++;
            } catch (\Exception $e) {
                $this->error("Failed to write point at step {$i}: " . $e->getMessage());
                return 1;
            }
        }

        $this->info("Successfully seeded {$pointsSeeded} telemetry points into InfluxDB!");
        return 0;
    }
}
