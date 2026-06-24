<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use App\Models\SensorType;

class SensorTypeController extends Controller
{
    /**
     * Display a listing of the sensor types.
     */
    public function index()
    {
        $sensorTypes = SensorType::all();
        return $this->success('Sensor types retrieved successfully', $sensorTypes);
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
}
