<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Threshold;
use App\Models\IotNode;
use Illuminate\Support\Facades\Validator;

class ThresholdController extends Controller
{
    /**
     * Retrieve threshold configurations for a given IoT Node.
     */
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
