<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FeedingLog;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class FeedingLogController extends Controller
{
    /**
     * Display a listing of feeding logs.
     * Supports filtering by date, cage_id, and operator_id.
     */
    public function index(Request $request)
    {
        $query = FeedingLog::with(['iotNode.cage', 'operator']);

        // Filter by date
        if ($request->has('date') && !empty($request->date)) {
            try {
                $date = Carbon::parse($request->date)->toDateString();
                $query->whereDate('created_at', $date);
            } catch (\Exception $e) {
                return $this->error('Format tanggal tidak valid. Gunakan format YYYY-MM-DD.', null, 422);
            }
        }

        // Filter by iot_node_id
        if ($request->has('iot_node_id') && !empty($request->iot_node_id)) {
            $query->where('iot_node_id', $request->iot_node_id);
        }

        // Filter by cage_id (via iotNode relationship)
        if ($request->has('cage_id') && !empty($request->cage_id)) {
            $query->whereHas('iotNode', function ($q) use ($request) {
                $q->where('cage_id', $request->cage_id);
            });
        }

        // Filter by operator_id
        if ($request->has('operator_id') && !empty($request->operator_id)) {
            $query->where('operator_id', $request->operator_id);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        return $this->success('Feeding logs retrieved successfully', $logs);
    }

    /**
     * Store a newly created feeding log.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_id' => 'required|integer|exists:iot_nodes,id',
            'operator_id' => 'required|integer|exists:operators,id',
            'feed_session' => 'required|string|in:morning,afternoon,night',
            'feed_type' => 'required|string|max:100',
            'weight_kg' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $log = FeedingLog::create([
            'iot_node_id' => $request->iot_node_id,
            'operator_id' => $request->operator_id,
            'feed_session' => $request->feed_session,
            'feed_type' => $request->feed_type,
            'weight_kg' => $request->weight_kg,
        ]);

        return $this->success('Feeding log registered successfully', $log->load(['iotNode.cage', 'operator']), 201);
    }


    /**
     * Remove the specified feeding log.
     */
    public function destroy(string $id)
    {
        $log = FeedingLog::find($id);

        if (!$log) {
            return $this->error('Log pakan tidak ditemukan.', null, 404);
        }

        $log->delete();

        return $this->success('Log pakan berhasil dihapus.');
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
