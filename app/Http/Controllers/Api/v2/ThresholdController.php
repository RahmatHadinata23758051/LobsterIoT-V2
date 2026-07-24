<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Threshold;
use App\Models\IotNode;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class ThresholdController extends Controller
{
    /**
     * Retrieve threshold configurations for a given IoT Node.
     */
    #[OA\Get(
        path: "/api/v2/thresholds",
        summary: "Daftar Ambang Batas Sensor",
        description: "Mengambil konfigurasi ambang batas sensor untuk IoT Node tertentu berdasarkan serial number.",
        tags: ["Thresholds"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "iot_node_serial_number", in: "query", required: true, schema: new OA\Schema(type: "string", example: "DEMO-NODE-001"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Daftar ambang batas berhasil diambil"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string|exists:iot_nodes,serial_number',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $thresholds = Threshold::where('iot_node_serial_number', $request->iot_node_serial_number)->get();

        return $this->success('Thresholds retrieved', $thresholds);
    }

    /**
     * Bulk update threshold configurations.
     */
    #[OA\Post(
        path: "/api/v2/thresholds/bulk-update",
        summary: "Bulk Update Ambang Batas Sensor",
        description: "Memperbarui atau membuat ambang batas sensor secara massal untuk satu IoT Node.",
        tags: ["Thresholds"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["iot_node_serial_number", "thresholds"],
                properties: [
                    new OA\Property(property: "iot_node_serial_number", type: "string", example: "DEMO-NODE-001"),
                    new OA\Property(
                        property: "thresholds",
                        type: "array",
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: "sensor_code", type: "string", example: "ph"),
                                new OA\Property(property: "value_min", type: "number", example: 6.5),
                                new OA\Property(property: "value_max", type: "number", example: 8.5),
                                new OA\Property(property: "offset_value", type: "number", example: 0.1),
                                new OA\Property(property: "filter_rules", type: "string", example: "moving_average")
                            ]
                        )
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Ambang batas berhasil diperbarui"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function bulkUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_serial_number' => 'required|string|exists:iot_nodes,serial_number',
            'thresholds' => 'required|array',
            'thresholds.*.sensor_code' => 'required|string|exists:sensor_types,sensor_code',
            'thresholds.*.value_min' => 'required|numeric',
            'thresholds.*.value_max' => 'required|numeric',
            'thresholds.*.offset_value' => 'nullable|numeric',
            'thresholds.*.filter_rules' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $serialNumber = $request->iot_node_serial_number;

        foreach ($request->thresholds as $thresholdData) {
            Threshold::updateOrCreate(
                [
                    'iot_node_serial_number' => $serialNumber,
                    'sensor_code' => $thresholdData['sensor_code'],
                ],
                [
                    'value_min' => $thresholdData['value_min'],
                    'value_max' => $thresholdData['value_max'],
                    'offset_value' => $thresholdData['offset_value'] ?? 0.00,
                    'filter_rules' => $thresholdData['filter_rules'] ?? null,
                ]
            );
        }

        return $this->success('Thresholds updated successfully');
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
