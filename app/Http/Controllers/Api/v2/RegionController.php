<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Province;
use App\Models\City;
use Laravolt\Indonesia\Models\District;

use OpenApi\Attributes as OA;

class RegionController extends Controller
{
    /**
     * Display a listing of provinces.
     */
    #[OA\Get(
        path: "/api/v2/provinces",
        summary: "Daftar Provinsi",
        description: "Mengambil seluruh data provinsi Indonesia.",
        tags: ["Regions"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar provinsi berhasil diambil")
        ]
    )]
    public function provinces()
    {
        $provinces = Province::orderBy('name', 'asc')->get();
        return $this->success('Provinces retrieved successfully', $provinces);
    }

    /**
     * Display a listing of cities.
     */
    #[OA\Get(
        path: "/api/v2/cities",
        summary: "Daftar Kota/Kabupaten",
        description: "Mengambil data kota/kabupaten dengan filter opsional berdasarkan provinsi.",
        tags: ["Regions"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "province_code", in: "query", required: false, description: "Kode provinsi untuk filter", schema: new OA\Schema(type: "string", example: "52")),
            new OA\Parameter(name: "province_id", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Daftar kota berhasil diambil")
        ]
    )]
    public function cities(Request $request)
    {
        $query = City::query();

        if ($request->has('province_code')) {
            $query->whereHas('province', function ($q) use ($request) {
                $q->where('code', $request->province_code);
            });
        }

        if ($request->has('province_id')) {
            $query->where('province_id', $request->province_id);
        }

        $cities = $query->orderBy('name', 'asc')->get();

        return $this->success('Cities retrieved successfully', $cities);
    }

    /**
     * Display a listing of districts.
     */
    #[OA\Get(
        path: "/api/v2/districts",
        summary: "Daftar Kecamatan",
        description: "Mengambil data kecamatan dengan filter opsional berdasarkan kode kota.",
        tags: ["Regions"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "city_code", in: "query", required: false, description: "Kode kota untuk filter", schema: new OA\Schema(type: "string", example: "5201"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Daftar kecamatan berhasil diambil")
        ]
    )]
    public function districts(Request $request)
    {
        $query = District::query();

        if ($request->has('city_code')) {
            $query->where('city_code', $request->city_code);
        }

        $districts = $query->orderBy('name', 'asc')->get();

        return $this->success('Districts retrieved successfully', $districts);
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
