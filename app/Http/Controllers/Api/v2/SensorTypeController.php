<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use App\Models\SensorType;

use OpenApi\Attributes as OA;

class SensorTypeController extends Controller
{
    /**
     * Display a listing of the sensor types.
     */
    #[OA\Get(
        path: "/api/v2/sensor-types",
        summary: "Daftar Tipe Sensor",
        description: "Mengambil seluruh tipe sensor yang tersedia dalam sistem (pH, TDS, DO, Suhu, dll).",
        tags: ["Sensor Types"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar tipe sensor berhasil diambil")
        ]
    )]
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
