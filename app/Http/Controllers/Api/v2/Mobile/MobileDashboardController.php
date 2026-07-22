<?php

namespace App\Http\Controllers\Api\v2\Mobile;

use App\Http\Controllers\Controller;
use App\Models\IotNode;
use App\Models\Threshold;
use App\Models\WeatherReport;
use App\Services\InfluxDBService;
use Illuminate\Http\Request;

class MobileDashboardController extends Controller
{
    protected InfluxDBService $influxDB;
    protected string $bucket;

    public function __construct(InfluxDBService $influxDB)
    {
        $this->influxDB = $influxDB;
        $this->bucket = config('influxdb.bucket', 'lobsense_telemetry');
    }

    /**
     * Mobile Aggregate "Super Endpoint": Single payload containing User Profile, Active Nodes, Latest Weather, and Alert Summary.
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        // 1. Fetch active nodes list
        $nodes = IotNode::whereNotNull('activated_at')
            ->with(['cage:id,cage_code,latitude,longitude'])
            ->get(['id', 'serial_number', 'ip_address', 'latitude', 'longitude', 'cage_id', 'activated_at']);

        // 2. Fetch latest weather report
        $weather = WeatherReport::latest()->first();

        // 3. Count total active nodes
        $totalNodes = $nodes->count();

        // 4. Default active node (first node or DEMO-NODE-001)
        $defaultSerial = $nodes->first()?->serial_number ?? 'DEMO-NODE-001';

        // 5. Fetch latest telemetry for default node
        $latestTelemetry = $this->getLatestTelemetry($defaultSerial);

        $locationName = collect([
            $weather?->village_name,
            $weather?->district_name,
            $weather?->city_name,
            $weather?->province_name
        ])->reject(fn($val) => empty($val) || trim($val) === '--')->first() ?? 'Bojongsoang';

        $appName = \App\Models\SystemSetting::where('key', 'system_logo_text')->value('value')
            ?? \App\Models\SystemSetting::where('key', 'app_name')->value('value')
            ?? \App\Models\SystemSetting::where('key', 'system_name')->value('value')
            ?? 'Lobsense';

        return response()->json([
            'status' => 'success',
            'message' => 'Ringkasan dasbor mobile berhasil dimuat',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'operator',
                ],
                'summary_stats' => [
                    'app_name' => $appName,
                    'total_active_nodes' => $totalNodes,
                    'weather_location' => $locationName,
                    'weather_temp_c' => (float) ($weather?->temperature ?? 28.0),
                    'weather_condition' => $weather?->weather_description ?? 'Cerah',
                ],
                'nodes' => $nodes,
                'active_node_telemetry' => [
                    'serial_number' => $defaultSerial,
                    'telemetry' => $latestTelemetry,
                ]
            ]
        ]);
    }

    /**
     * Lightweight telemetry endpoint for a specific IoT Node in mobile view.
     */
    public function nodeTelemetry(string $serialNumber)
    {
        $node = IotNode::where('serial_number', $serialNumber)
            ->with(['cage:id,cage_code', 'feedingLogs' => function($q) {
                $q->latest()->limit(3);
            }])
            ->first();

        if (!$node) {
            return response()->json([
                'status' => 'error',
                'message' => 'IoT Node tidak ditemukan.',
                'data' => null
            ], 404);
        }

        $latest = $this->getLatestTelemetry($serialNumber);
        $thresholds = Threshold::where('iot_node_serial_number', $serialNumber)
            ->get(['sensor_code', 'value_min', 'value_max']);

        return response()->json([
            'status' => 'success',
            'message' => 'Data telemetry mobile berhasil dimuat',
            'data' => [
                'serial_number' => $serialNumber,
                'cage_code' => $node->cage->cage_code ?? 'CAGE-DEFAULT',
                'ip_address' => $node->ip_address,
                'latitude' => $node->latitude,
                'longitude' => $node->longitude,
                'telemetry' => $latest,
                'thresholds' => $thresholds,
                'recent_feeding_logs' => $node->feedingLogs
            ]
        ]);
    }

    /**
     * Helper to fetch latest telemetry point from InfluxDB with fallback mock.
     */
    protected function getLatestTelemetry(string $serialNumber): array
    {
        try {
            $latestQuery = 'from(bucket: "' . $this->bucket . '")
                |> range(start: -30d)
                |> filter(fn: (r) => r["_measurement"] == "telemetries")
                |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
                |> drop(columns: ["cage_code"])
                |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
                |> tail(n: 1)';

            $latestResult = $this->influxDB->queryParsed($latestQuery);
            if (!empty($latestResult)) {
                return $latestResult[0];
            }
        } catch (\Exception $e) {
            // Fallback when TSDB unavailable
        }

        return [];
    }
}
