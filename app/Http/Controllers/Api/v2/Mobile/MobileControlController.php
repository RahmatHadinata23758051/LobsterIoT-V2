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
     * Get feeding schedules & recent logs for mobile control screen.
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

        $logs = $query->latest()->limit(15)->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Data jadwal & log pakan mobile berhasil dimuat',
            'data' => [
                'recent_logs' => $logs,
            ]
        ]);
    }

    /**
     * Store new feeding schedule / record from mobile.
     */
    public function storeSchedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string|exists:iot_nodes,serial_number',
            'food_type' => 'required|string|max:100',
            'amount_kg' => 'required|numeric|min:0.1',
            'notes' => 'nullable|string|max:255',
            'scheduled_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi input gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $node = IotNode::where('serial_number', $request->iot_node_serial_number)->first();

        $log = FeedingLog::create([
            'iot_node_id' => $node->id,
            'user_id' => $request->user()->id,
            'food_type' => $request->food_type,
            'amount_kg' => $request->amount_kg,
            'notes' => $request->notes ?? 'Pemberian pakan via Mobile App',
            'fed_at' => $request->scheduled_at ?? now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal / Log pakan berhasil disimpan dari Mobile App',
            'data' => $log->load(['iotNode:id,serial_number', 'user:id,name'])
        ], 201);
    }

    /**
     * Trigger instant manual feeding / emergency relay switch from mobile.
     */
    public function triggerInstant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string|exists:iot_nodes,serial_number',
            'duration_seconds' => 'nullable|integer|min:1|max:300',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi input gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $duration = $request->input('duration_seconds', 5);
        $node = IotNode::where('serial_number', $request->iot_node_serial_number)->first();

        // Record instant feeding event to database
        $log = FeedingLog::create([
            'iot_node_id' => $node->id,
            'user_id' => $request->user()->id,
            'food_type' => 'Pakan Otomatis (Instant Trigger)',
            'amount_kg' => 0.5,
            'notes' => "Perintah pakan manual instant ($duration detik) via Mobile App",
            'fed_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Perintah pakan manual ($duration s) berhasil dikirim ke Node {$request->iot_node_serial_number}",
            'data' => [
                'serial_number' => $request->iot_node_serial_number,
                'duration_seconds' => $duration,
                'triggered_at' => now()->toIso8601String(),
                'log' => $log
            ]
        ]);
    }
}
