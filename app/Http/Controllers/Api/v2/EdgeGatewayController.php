<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EdgeGateway;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class EdgeGatewayController extends Controller
{
    /**
     * Display a listing of edge gateways.
     */
    #[OA\Get(
        path: "/api/v2/edge-gateways",
        summary: "Daftar Semua Edge Gateway",
        description: "Mengambil seluruh data Edge Gateway beserta relasi kota.",
        tags: ["Edge Gateways"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar Edge Gateway berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function index()
    {
        $gateways = EdgeGateway::with(['city'])->get();
        return response()->json([
            'status' => 'success',
            'message' => 'Edge Gateways retrieved successfully',
            'data' => $gateways
        ]);
    }

    /**
     * Store a newly created edge gateway.
     */
    #[OA\Post(
        path: "/api/v2/edge-gateways",
        summary: "Tambah Edge Gateway Baru",
        description: "Mendaftarkan perangkat Edge Gateway baru ke dalam sistem.",
        tags: ["Edge Gateways"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["serial_number"],
                properties: [
                    new OA\Property(property: "serial_number", type: "string", example: "EDGE-GW-002"),
                    new OA\Property(property: "city_id", type: "integer", example: 5201),
                    new OA\Property(property: "ram_memory", type: "string", example: "4GB"),
                    new OA\Property(property: "cpu_speed", type: "string", example: "1.8GHz"),
                    new OA\Property(property: "operating_system", type: "string", example: "Raspbian OS"),
                    new OA\Property(property: "runtime_framework", type: "string", example: "Flutter 3.24"),
                    new OA\Property(property: "power_supply_type", type: "string", example: "Solar"),
                    new OA\Property(property: "voltage_level", type: "string", example: "12V"),
                    new OA\Property(property: "ip_address", type: "string", example: "192.168.1.100"),
                    new OA\Property(property: "gateway_ip", type: "string", example: "192.168.1.1"),
                    new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                    new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456),
                    new OA\Property(property: "max_connected_nodes", type: "integer", example: 8)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Edge Gateway berhasil dibuat"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serial_number' => 'required|string|max:100|unique:edge_gateways,serial_number',
            'city_id' => 'nullable|integer|exists:cities,id',
            'ram_memory' => 'nullable|string|max:50',
            'cpu_speed' => 'nullable|string|max:50',
            'operating_system' => 'nullable|string|max:100',
            'runtime_framework' => 'nullable|string|max:100',
            'power_supply_type' => 'nullable|string|max:100',
            'voltage_level' => 'nullable|string|max:50',
            'ip_address' => 'nullable|ip',
            'gateway_ip' => 'nullable|ip',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'max_connected_nodes' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $gateway = EdgeGateway::create($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Edge Gateway created successfully',
            'data' => $gateway
        ], 201);
    }

    /**
     * Display the specified edge gateway.
     */
    #[OA\Get(
        path: "/api/v2/edge-gateways/{id}",
        summary: "Detail Edge Gateway",
        description: "Mengambil detail data satu Edge Gateway berdasarkan ID.",
        tags: ["Edge Gateways"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail Edge Gateway berhasil diambil"),
            new OA\Response(response: 404, description: "Edge Gateway tidak ditemukan")
        ]
    )]
    public function show($id)
    {
        $gateway = EdgeGateway::with(['city'])->find($id);
        if (!$gateway) {
            return response()->json(['status' => 'error', 'message' => 'Edge Gateway tidak ditemukan.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $gateway]);
    }

    /**
     * Update the specified edge gateway.
     */
    #[OA\Put(
        path: "/api/v2/edge-gateways/{id}",
        summary: "Update Edge Gateway",
        description: "Memperbarui data Edge Gateway yang sudah ada.",
        tags: ["Edge Gateways"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "serial_number", type: "string", example: "EDGE-GW-002"),
                    new OA\Property(property: "city_id", type: "integer", example: 5201),
                    new OA\Property(property: "ram_memory", type: "string", example: "8GB"),
                    new OA\Property(property: "cpu_speed", type: "string", example: "2.4GHz"),
                    new OA\Property(property: "ip_address", type: "string", example: "192.168.1.200"),
                    new OA\Property(property: "max_connected_nodes", type: "integer", example: 16)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Edge Gateway berhasil diperbarui"),
            new OA\Response(response: 404, description: "Edge Gateway tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function update(Request $request, $id)
    {
        $gateway = EdgeGateway::find($id);
        if (!$gateway) {
            return response()->json(['status' => 'error', 'message' => 'Edge Gateway tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'serial_number' => 'sometimes|required|string|max:100|unique:edge_gateways,serial_number,' . $id,
            'city_id' => 'nullable|integer|exists:cities,id',
            'ram_memory' => 'nullable|string|max:50',
            'cpu_speed' => 'nullable|string|max:50',
            'operating_system' => 'nullable|string|max:100',
            'runtime_framework' => 'nullable|string|max:100',
            'power_supply_type' => 'nullable|string|max:100',
            'voltage_level' => 'nullable|string|max:50',
            'ip_address' => 'nullable|ip',
            'gateway_ip' => 'nullable|ip',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'max_connected_nodes' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $gateway->update($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Edge Gateway updated successfully',
            'data' => $gateway
        ]);
    }

    /**
     * Remove the specified edge gateway.
     */
    #[OA\Delete(
        path: "/api/v2/edge-gateways/{id}",
        summary: "Hapus Edge Gateway",
        description: "Menghapus data Edge Gateway berdasarkan ID.",
        tags: ["Edge Gateways"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Edge Gateway berhasil dihapus"),
            new OA\Response(response: 404, description: "Edge Gateway tidak ditemukan")
        ]
    )]
    public function destroy($id)
    {
        $gateway = EdgeGateway::find($id);
        if (!$gateway) {
            return response()->json(['status' => 'error', 'message' => 'Edge Gateway tidak ditemukan.'], 404);
        }
        $gateway->delete();
        return response()->json(['status' => 'success', 'message' => 'Edge Gateway deleted successfully']);
    }
}
