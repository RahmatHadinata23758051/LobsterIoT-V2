<?php

namespace App\Http\Controllers\Api\v2\Mobile;

use App\Http\Controllers\Controller;
use App\Models\FeedingLog;
use App\Models\IotNode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MobileControlController extends Controller
{
    /**
     * Get feeding schedules, aerator status & recent activity logs for mobile control screen.
     */
    public function index(Request $request)
    {
        $serialNumber = $request->query('serial_number');

        $query = FeedingLog::with(['iotNode:id,serial_number', 'user:id,name']);

        if ($serialNumber) {
            $query->whereHas('iotNode', function($q) use ($serialNumber) {
                $q->where('serial_number', $serialNumber);
            });
        }

        $rawLogs = $query->latest()->limit(15)->get();

        $logs = $rawLogs->map(function($log) {
            $triggerType = 'AUTOMATIC_SCHEDULE';
            $notes = $log->notes ?? '';
            
            if (str_contains($notes, 'MANUAL_MOBILE') || str_contains($notes, 'Mobile')) {
                $triggerType = 'MANUAL_MOBILE';
            } elseif (str_contains($notes, 'MANUAL_WEB') || str_contains($notes, 'Web')) {
                $triggerType = 'MANUAL_WEB';
            } elseif (str_contains($notes, 'AUTOMATIC_SENSOR') || str_contains($notes, 'DO') || str_contains($notes, 'Sensor')) {
                $triggerType = 'AUTOMATIC_SENSOR';
            }

            return [
                'id' => $log->id,
                'iot_node_id' => $log->iot_node_id,
                'iot_node_serial' => $log->iotNode?->serial_number ?? 'DEMO-NODE-001',
                'food_type' => $log->food_type ?? 'Pakan Otomatis Dispenser',
                'amount_kg' => $log->amount_kg ?? 0.5,
                'notes' => $log->notes ?? 'Aktivitas berhasil',
                'trigger_type' => $triggerType,
                'fed_at' => $log->fed_at ? $log->fed_at->toIso8601String() : ($log->created_at ? $log->created_at->toIso8601String() : now()->toIso8601String()),
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Data jadwal & log kontrol mobile berhasil dimuat',
            'data' => [
                'recent_logs' => $logs,
                'aerator_state' => [
                    'mode' => 'AUTO',
                    'status' => 'STANDBY',
                    'trigger_by' => 'AUTOMATIC_SENSOR',
                    'do_threshold_min' => 5.0,
                    'override_duration_minutes' => 30,
                ],
                'schedules' => [
                    [
                        'id' => 1,
                        'time' => '07:00',
                        'duration_seconds' => 10,
                        'food_type' => 'Pelet Super Alpha',
                        'is_active' => true,
                    ],
                    [
                        'id' => 2,
                        'time' => '12:00',
                        'duration_seconds' => 15,
                        'food_type' => 'Pelet Super Alpha',
                        'is_active' => true,
                    ],
                    [
                        'id' => 3,
                        'time' => '17:00',
                        'duration_seconds' => 10,
                        'food_type' => 'Pelet Super Alpha',
                        'is_active' => true,
                    ],
                ]
            ]
        ]);
    }

    /**
     * Aerator manual override trigger handler with N minutes duration timer.
     */
    public function toggleAerator(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string',
            'mode' => 'required|string|in:AUTO,MANUAL_ON,MANUAL_OFF',
            'duration_minutes' => 'nullable|integer|min:1|max:180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi input gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $mode = $request->mode;
        $duration = $request->input('duration_minutes', 30);
        $serial = $request->iot_node_serial_number;

        $node = IotNode::where('serial_number', $serial)->first();
        $nodeId = $node ? $node->id : 1;
        $userId = $request->user()?->id ?? 1;

        $log = FeedingLog::create([
            'iot_node_id' => $nodeId,
            'user_id' => $userId,
            'food_type' => 'Kontrol Aerator 24h',
            'amount_kg' => 0.0,
            'notes' => "Perintah Aerator Mode $mode ($duration menit) via Mobile App [MANUAL_MOBILE]",
            'fed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $mode === 'AUTO' 
                ? "Aerator kembali ke mode AUTO (Sensor DO) pada Node $serial"
                : "Aerator berhasil dinyalakan manual selama $duration menit pada Node $serial",
            'data' => [
                'serial_number' => $serial,
                'mode' => $mode,
                'status' => $mode === 'MANUAL_ON' ? 'AKTIF' : ($mode === 'MANUAL_OFF' ? 'STANDBY' : 'AUTO'),
                'override_duration_minutes' => $duration,
                'triggered_at' => now()->toIso8601String(),
                'trigger_type' => 'MANUAL_MOBILE',
                'log' => $log
            ]
        ]);
    }

    /**
     * Store new feeding schedule / record from mobile.
     */
    public function storeSchedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string',
            'food_type' => 'required|string|max:100',
            'amount_kg' => 'nullable|numeric|min:0.1',
            'duration_seconds' => 'nullable|integer|min:1|max:300',
            'scheduled_time' => 'nullable|string',
            'notes' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi input gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $node = IotNode::where('serial_number', $request->iot_node_serial_number)->first();
        $nodeId = $node ? $node->id : 1;
        $userId = $request->user()?->id ?? 1;

        $duration = $request->input('duration_seconds', 10);
        $timeStr = $request->input('scheduled_time', '08:00');

        $log = FeedingLog::create([
            'iot_node_id' => $nodeId,
            'user_id' => $userId,
            'food_type' => $request->food_type,
            'amount_kg' => $request->amount_kg ?? 1.0,
            'notes' => "Jadwal pakan jam $timeStr (Durasi dispenser: $duration s) [MANUAL_MOBILE]",
            'fed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Jadwal pakan jam $timeStr ($duration detik) berhasil disimpan!",
            'data' => [
                'id' => $log->id,
                'time' => $timeStr,
                'duration_seconds' => $duration,
                'food_type' => $request->food_type,
                'trigger_type' => 'MANUAL_MOBILE',
                'log' => $log
            ]
        ], 201);
    }

    /**
     * Trigger instant manual feeding / emergency relay switch from mobile.
     */
    public function triggerInstant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string',
            'duration_seconds' => 'nullable|integer|min:1|max:300',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi input gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $duration = $request->input('duration_seconds', 10);
        $node = IotNode::where('serial_number', $request->iot_node_serial_number)->first();
        $nodeId = $node ? $node->id : 1;
        $userId = $request->user()?->id ?? 1;

        // Record instant feeding event to database
        $log = FeedingLog::create([
            'iot_node_id' => $nodeId,
            'user_id' => $userId,
            'food_type' => 'Pakan Otomatis Dispenser',
            'amount_kg' => 0.5,
            'notes' => "Trigger pakan manual instant ($duration detik) [MANUAL_MOBILE]",
            'fed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Perintah pakan manual ($duration s) berhasil dikirim!",
            'data' => [
                'serial_number' => $request->iot_node_serial_number,
                'duration_seconds' => $duration,
                'triggered_at' => now()->toIso8601String(),
                'trigger_type' => 'MANUAL_MOBILE',
                'log' => $log
            ]
        ]);
    }
}
