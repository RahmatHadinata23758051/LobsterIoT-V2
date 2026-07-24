<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cage;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class CageController extends Controller
{
    /**
     * Display a listing of the cages.
     */
    #[OA\Get(
        path: "/api/v2/cages",
        summary: "Daftar Semua Keramba (KJA)",
        description: "Mengambil seluruh data keramba jaring apung yang terdaftar dalam sistem.",
        tags: ["Cages (KJA)"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar keramba berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function index()
    {
        $cages = Cage::all();
        return $this->success('Cages retrieved successfully', $cages);
    }

    /**
     * Store a newly created cage in storage.
     */
    #[OA\Post(
        path: "/api/v2/cages",
        summary: "Tambah Keramba Baru",
        description: "Membuat data keramba jaring apung (KJA) baru.",
        tags: ["Cages (KJA)"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["cage_code"],
                properties: [
                    new OA\Property(property: "cage_code", type: "string", example: "CAGE-B02"),
                    new OA\Property(property: "edge_gateway_id", type: "integer", example: 1),
                    new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                    new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456),
                    new OA\Property(property: "volume_cubic_meters", type: "number", format: "double", example: 12.5),
                    new OA\Property(property: "structure_condition", type: "string", example: "Baik"),
                    new OA\Property(property: "lobster_count", type: "integer", example: 250),
                    new OA\Property(property: "lobster_age_days", type: "integer", example: 45)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Keramba berhasil dibuat"),
            new OA\Response(response: 422, description: "Validasi gagal"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cage_code' => 'required|string|max:50|unique:cages,cage_code',
            'edge_gateway_id' => 'nullable|integer|exists:edge_gateways,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'volume_cubic_meters' => 'nullable|numeric|min:0.1',
            'structure_condition' => 'nullable|string|max:100',
            'lobster_count' => 'nullable|integer|min:0',
            'lobster_age_days' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $cage = Cage::create([
            'cage_code' => $request->cage_code,
            'edge_gateway_id' => $request->edge_gateway_id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'volume_cubic_meters' => $request->volume_cubic_meters,
            'structure_condition' => $request->structure_condition,
            'lobster_count' => $request->lobster_count,
            'lobster_age_days' => $request->lobster_age_days,
            'age_last_updated_at' => $request->filled('lobster_age_days') ? now() : null,
        ]);

        return $this->success('Cage created successfully', $cage->load('edgeGateway'), 201);
    }

    /**
     * Display the specified cage.
     */
    #[OA\Get(
        path: "/api/v2/cages/{id}",
        summary: "Detail Keramba",
        description: "Mengambil detail data satu keramba berdasarkan ID.",
        tags: ["Cages (KJA)"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail keramba berhasil diambil"),
            new OA\Response(response: 404, description: "Keramba tidak ditemukan")
        ]
    )]
    public function show($id)
    {
        $cage = Cage::with('edgeGateway')->find($id);

        if (!$cage) {
            return $this->error('Cage tidak ditemukan.', null, 404);
        }

        return $this->success('Cage retrieved successfully', $cage);
    }

    /**
     * Update the specified cage in storage.
     */
    #[OA\Put(
        path: "/api/v2/cages/{id}",
        summary: "Update Keramba",
        description: "Memperbarui data keramba jaring apung yang sudah ada.",
        tags: ["Cages (KJA)"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "cage_code", type: "string", example: "CAGE-B02"),
                    new OA\Property(property: "edge_gateway_id", type: "integer", example: 1),
                    new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                    new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456),
                    new OA\Property(property: "volume_cubic_meters", type: "number", format: "double", example: 12.5),
                    new OA\Property(property: "structure_condition", type: "string", example: "Baik"),
                    new OA\Property(property: "lobster_count", type: "integer", example: 300),
                    new OA\Property(property: "lobster_age_days", type: "integer", example: 60)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Keramba berhasil diperbarui"),
            new OA\Response(response: 404, description: "Keramba tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function update(Request $request, $id)
    {
        $cage = Cage::find($id);

        if (!$cage) {
            return $this->error('Cage tidak ditemukan.', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'cage_code' => 'sometimes|required|string|max:50|unique:cages,cage_code,' . $id,
            'edge_gateway_id' => 'nullable|integer|exists:edge_gateways,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'volume_cubic_meters' => 'nullable|numeric|min:0.1',
            'structure_condition' => 'nullable|string|max:100',
            'lobster_count' => 'nullable|integer|min:0',
            'lobster_age_days' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $data = $request->only([
            'cage_code',
            'edge_gateway_id',
            'latitude',
            'longitude',
            'volume_cubic_meters',
            'structure_condition',
            'lobster_count',
            'lobster_age_days',
        ]);

        if ($request->filled('lobster_age_days')) {
            $data['age_last_updated_at'] = now();
        }

        $cage->update($data);

        return $this->success('Cage updated successfully', $cage->load('edgeGateway'));
    }

    /**
     * Remove the specified cage from storage.
     */
    #[OA\Delete(
        path: "/api/v2/cages/{id}",
        summary: "Hapus Keramba",
        description: "Menghapus data keramba jaring apung berdasarkan ID.",
        tags: ["Cages (KJA)"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Keramba berhasil dihapus"),
            new OA\Response(response: 404, description: "Keramba tidak ditemukan")
        ]
    )]
    public function destroy($id)
    {
        $cage = Cage::find($id);

        if (!$cage) {
            return $this->error('Cage tidak ditemukan.', null, 404);
        }

        $cage->delete();

        return $this->success('Cage deleted successfully');
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
