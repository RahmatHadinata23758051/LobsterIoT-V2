<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WeatherReport;

use OpenApi\Attributes as OA;

class WeatherController extends Controller
{
    /**
     * Display the latest weather reports.
     */
    #[OA\Get(
        path: "/api/v2/weather/latest",
        summary: "Data Cuaca Terbaru",
        description: "Mengambil laporan cuaca terbaru dengan filter opsional berdasarkan kode kota.",
        tags: ["Weather"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "city_code", in: "query", required: false, description: "Kode kota untuk filter cuaca", schema: new OA\Schema(type: "string", example: "5201"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Data cuaca terbaru berhasil diambil")
        ]
    )]
    public function latest(Request $request)
    {
        $query = WeatherReport::query();

        if ($request->has('city_code')) {
            $query->where('city_code', $request->city_code);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        return $this->success('Latest weather reports retrieved successfully', $reports);
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
