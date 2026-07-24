<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IotNode;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class IotNodeController extends Controller
{
    /**
     * Display a listing of IoT nodes.
     */
    #[OA\Get(
        path: "/api/v2/iot-nodes-master",
        summary: "Daftar Semua IoT Node (Master)",
        description: "Mengambil seluruh data IoT Node master beserta relasi kota, Edge Gateway, dan Keramba.",
        tags: ["IoT Nodes Master"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar IoT Node berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function index()
    {
        $nodes = IotNode::with(['city', 'edgeGateway', 'cage.edgeGateway'])->get();
        return response()->json([
            'status' => 'success',
            'message' => 'IoT Nodes retrieved successfully',
            'data' => $nodes
        ]);
    }

    /**
     * Store a newly created IoT node.
     */
    #[OA\Post(
        path: "/api/v2/iot-nodes-master",
        summary: "Tambah IoT Node Baru",
        description: "Mendaftarkan IoT Node baru ke dalam sistem. Node akan otomatis diaktivasi saat dibuat melalui panel manajemen.",
        tags: ["IoT Nodes Master"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["serial_number", "city_id"],
                properties: [
                    new OA\Property(property: "serial_number", type: "string", example: "LOB-NODE-003"),
                    new OA\Property(property: "city_id", type: "integer", example: 5201),
                    new OA\Property(property: "edge_gateway_id", type: "integer", example: 1),
                    new OA\Property(property: "cage_id", type: "integer", example: 1),
                    new OA\Property(property: "gateway_channel_number", type: "integer", example: 3),
                    new OA\Property(property: "ip_address", type: "string", example: "192.168.1.50"),
                    new OA\Property(property: "gateway_ip", type: "string", example: "192.168.1.1"),
                    new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                    new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456),
                    new OA\Property(property: "owner_id", type: "integer", example: 1)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "IoT Node berhasil dibuat"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serial_number' => 'required|string|max:100|unique:iot_nodes,serial_number',
            'city_id' => 'required|integer|exists:cities,id',
            'edge_gateway_id' => 'nullable|integer|exists:edge_gateways,id',
            'cage_id' => 'nullable|integer|exists:cages,id',
            'gateway_channel_number' => 'nullable|integer|min:0',
            'ip_address' => 'nullable|ip',
            'gateway_ip' => 'nullable|ip',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'owner_id' => 'nullable|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $payload = $request->all();
        if (empty($payload['owner_id'])) {
            $payload['owner_id'] = auth()->id();
        }
        // Auto-activate and install new IoT Nodes created through management panel so they instantly show up
        $payload['activated_at'] = now();
        $payload['installed_at'] = now();
        $payload['activated_by'] = auth()->id();

        $node = IotNode::create($payload);

        return response()->json([
            'status' => 'success',
            'message' => 'IoT Node created successfully',
            'data' => $node->load(['city', 'edgeGateway', 'cage.edgeGateway'])
        ], 201);
    }

    /**
     * Display the specified IoT node.
     */
    #[OA\Get(
        path: "/api/v2/iot-nodes-master/{id}",
        summary: "Detail IoT Node",
        description: "Mengambil detail data satu IoT Node berdasarkan ID.",
        tags: ["IoT Nodes Master"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail IoT Node berhasil diambil"),
            new OA\Response(response: 404, description: "IoT Node tidak ditemukan")
        ]
    )]
    public function show($id)
    {
        $node = IotNode::with(['city', 'cage.edgeGateway'])->find($id);
        if (!$node) {
            return response()->json(['status' => 'error', 'message' => 'IoT Node tidak ditemukan.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $node]);
    }

    /**
     * Update the specified IoT node.
     */
    #[OA\Put(
        path: "/api/v2/iot-nodes-master/{id}",
        summary: "Update IoT Node",
        description: "Memperbarui data IoT Node yang sudah ada. Jika belum teraktivasi, akan otomatis diaktivasi saat update.",
        tags: ["IoT Nodes Master"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "serial_number", type: "string", example: "LOB-NODE-003"),
                    new OA\Property(property: "city_id", type: "integer", example: 5201),
                    new OA\Property(property: "edge_gateway_id", type: "integer", example: 1),
                    new OA\Property(property: "cage_id", type: "integer", example: 2),
                    new OA\Property(property: "ip_address", type: "string", example: "192.168.1.55"),
                    new OA\Property(property: "latitude", type: "number", format: "double", example: -8.125),
                    new OA\Property(property: "longitude", type: "number", format: "double", example: 115.458)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "IoT Node berhasil diperbarui"),
            new OA\Response(response: 404, description: "IoT Node tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function update(Request $request, $id)
    {
        $node = IotNode::find($id);
        if (!$node) {
            return response()->json(['status' => 'error', 'message' => 'IoT Node tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'serial_number' => 'sometimes|required|string|max:100|unique:iot_nodes,serial_number,' . $id,
            'city_id' => 'sometimes|required|integer|exists:cities,id',
            'edge_gateway_id' => 'nullable|integer|exists:edge_gateways,id',
            'cage_id' => 'nullable|integer|exists:cages,id',
            'gateway_channel_number' => 'nullable|integer|min:0',
            'ip_address' => 'nullable|ip',
            'gateway_ip' => 'nullable|ip',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'owner_id' => 'nullable|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $payload = $request->all();
        if ($node->activated_at === null) {
            $payload['activated_at'] = now();
            $payload['installed_at'] = now();
            $payload['activated_by'] = auth()->id();
        }

        $node->update($payload);

        return response()->json([
            'status' => 'success',
            'message' => 'IoT Node updated successfully',
            'data' => $node->load(['city', 'edgeGateway', 'cage.edgeGateway'])
        ]);
    }

    /**
     * Remove the specified IoT node.
     */
    #[OA\Delete(
        path: "/api/v2/iot-nodes-master/{id}",
        summary: "Hapus IoT Node",
        description: "Menghapus data IoT Node berdasarkan ID.",
        tags: ["IoT Nodes Master"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "IoT Node berhasil dihapus"),
            new OA\Response(response: 404, description: "IoT Node tidak ditemukan")
        ]
    )]
    public function destroy($id)
    {
        $node = IotNode::find($id);
        if (!$node) {
            return response()->json(['status' => 'error', 'message' => 'IoT Node tidak ditemukan.'], 404);
        }
        $node->delete();
        return response()->json(['status' => 'success', 'message' => 'IoT Node deleted successfully']);
    }
}
