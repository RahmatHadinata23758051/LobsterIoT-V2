<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use App\Models\IotNode;
use App\Models\Threshold;
use App\Services\InfluxDBService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MonitoringController extends Controller
{
    protected InfluxDBService $influxDB;
    protected string $bucket;

    public function __construct(InfluxDBService $influxDB)
    {
        $this->influxDB = $influxDB;
        $this->bucket = config('influxdb.bucket', 'lobsense_telemetry');
    }

    /**
     * List all activated IoT Nodes with their city.
     */
    public function activeNodes()
    {
        $nodes = IotNode::whereNotNull('activated_at')
            ->with(['city:id,code,name', 'city.province:id,code,name'])
            ->get(['id', 'serial_number', 'ip_address', 'latitude', 'longitude', 'city_id']);

        return $this->success('Activated nodes retrieved', $nodes);
    }

    /**
     * Compile latest, 24h series, and thresholds for a specific IoT Node.
     */
    public function dashboard(string $serialNumber)
    {
        $nodeExists = IotNode::where('serial_number', $serialNumber)->exists();
        if (!$nodeExists) {
            return $this->error('IoT Node tidak ditemukan.', null, 404);
        }

        // 1. Fetch latest telemetry point (look back up to 30 days)
        $latestQuery = 'from(bucket: "' . $this->bucket . '")
            |> range(start: -30d)
            |> filter(fn: (r) => r["_measurement"] == "telemetries")
            |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> tail(n: 1)';

        $latestResult = $this->influxDB->queryParsed($latestQuery);
        $latest = !empty($latestResult) ? $latestResult[0] : null;

        // 2. Fetch 24h series data in 5m intervals
        $seriesQuery = 'from(bucket: "' . $this->bucket . '")
            |> range(start: -24h)
            |> filter(fn: (r) => r["_measurement"] == "telemetries")
            |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
            |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")';

        $series24h = $this->influxDB->queryParsed($seriesQuery);

        // 3. Fetch thresholds from relational DB
        $thresholds = Threshold::where('iot_node_serial_number', $serialNumber)
            ->get(['sensor_code', 'value_min', 'value_max']);

        return $this->success('Dashboard data compiled', [
            'latest' => $latest,
            'series_24h' => $series24h,
            'thresholds' => $thresholds
        ]);
    }

    /**
     * Query historical telemetry range for a node.
     */
    public function history(Request $request, string $serialNumber)
    {
        $nodeExists = IotNode::where('serial_number', $serialNumber)->exists();
        if (!$nodeExists) {
            return $this->error('IoT Node tidak ditemukan.', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'startDate' => 'required|date_format:Y-m-d',
            'endDate' => 'required|date_format:Y-m-d',
            'limit' => 'nullable|integer|min:1|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi tanggal gagal.', $validator->errors(), 422);
        }

        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $limit = (int) $request->input('limit', 100);

        // Convert Y-m-d parameters to ISO8601/RFC3339 UTC strings
        $startIso = $startDate . 'T00:00:00Z';
        $stopIso = $endDate . 'T23:59:59Z';

        $historyQuery = 'from(bucket: "' . $this->bucket . '")
            |> range(start: ' . $startIso . ', stop: ' . $stopIso . ')
            |> filter(fn: (r) => r["_measurement"] == "telemetries")
            |> filter(fn: (r) => r["iot_node_serial_number"] == "' . $serialNumber . '")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> limit(n: ' . $limit . ')';

        $telemetries = $this->influxDB->queryParsed($historyQuery);

        return $this->success('Historical data retrieved', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'telemetries' => $telemetries
        ]);
    }

    /**
     * Standard success JSON response envelope.
     */
    protected function success(string $message, $data = null, int $status = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $status);
    }

    /**
     * Standard error JSON response envelope.
     */
    protected function error(string $message, $data = null, int $status = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => $data
        ], $status);
    }
}
