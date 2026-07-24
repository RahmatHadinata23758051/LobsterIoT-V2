<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FeedingLog;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

use OpenApi\Attributes as OA;

class FeedingLogController extends Controller
{
    /**
     * Display a listing of feeding logs.
     * Supports filtering by date, cage_id, and operator_id.
     */
    #[OA\Get(
        path: "/api/v2/feeding-logs",
        summary: "Daftar Log Pemberian Pakan",
        description: "Mengambil seluruh log pemberian pakan dengan filter opsional berdasarkan tanggal, IoT Node, keramba, atau operator.",
        tags: ["Feeding Logs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "date", in: "query", required: false, description: "Filter tanggal (YYYY-MM-DD)", schema: new OA\Schema(type: "string", format: "date", example: "2026-07-24")),
            new OA\Parameter(name: "iot_node_id", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1)),
            new OA\Parameter(name: "cage_id", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1)),
            new OA\Parameter(name: "operator_id", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Daftar log pakan berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
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
    #[OA\Post(
        path: "/api/v2/feeding-logs",
        summary: "Catat Log Pakan Baru",
        description: "Mencatat pemberian pakan baru untuk IoT Node tertentu.",
        tags: ["Feeding Logs"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["iot_node_id", "operator_id", "feed_session", "feed_type", "weight_kg"],
                properties: [
                    new OA\Property(property: "iot_node_id", type: "integer", example: 1),
                    new OA\Property(property: "operator_id", type: "integer", example: 1),
                    new OA\Property(property: "feed_session", type: "string", enum: ["morning", "afternoon", "night"], example: "morning"),
                    new OA\Property(property: "feed_type", type: "string", example: "Pelet Premium"),
                    new OA\Property(property: "weight_kg", type: "number", format: "double", example: 2.5)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Log pakan berhasil dicatat"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
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
    #[OA\Delete(
        path: "/api/v2/feeding-logs/{id}",
        summary: "Hapus Log Pakan",
        description: "Menghapus log pemberian pakan berdasarkan ID.",
        tags: ["Feeding Logs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Log pakan berhasil dihapus"),
            new OA\Response(response: 404, description: "Log pakan tidak ditemukan")
        ]
    )]
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
