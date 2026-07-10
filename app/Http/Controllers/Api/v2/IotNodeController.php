<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IotNode;
use Illuminate\Support\Facades\Validator;

class IotNodeController extends Controller
{
    public function index()
    {
        $nodes = IotNode::with(['city', 'edgeGateway'])->get();
        return response()->json([
            'status' => 'success',
            'message' => 'IoT Nodes retrieved successfully',
            'data' => $nodes
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serial_number' => 'required|string|max:100|unique:iot_nodes,serial_number',
            'city_id' => 'required|integer|exists:cities,id',
            'edge_gateway_id' => 'nullable|integer|exists:edge_gateways,id',
            'gateway_channel_number' => 'nullable|integer',
            'ip_address' => 'nullable|string|max:45',
            'gateway_ip' => 'nullable|string|max:45',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'owner_id' => 'nullable|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $payload = $request->all();
        if (empty($payload['owner_id'])) {
            $payload['owner_id'] = auth()->id();
        }

        $node = IotNode::create($payload);

        return response()->json([
            'status' => 'success',
            'message' => 'IoT Node created successfully',
            'data' => $node
        ], 201);
    }

    public function show($id)
    {
        $node = IotNode::with(['city', 'edgeGateway'])->find($id);
        if (!$node) {
            return response()->json(['status' => 'error', 'message' => 'IoT Node tidak ditemukan.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $node]);
    }

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
            'gateway_channel_number' => 'nullable|integer',
            'ip_address' => 'nullable|string|max:45',
            'gateway_ip' => 'nullable|string|max:45',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'owner_id' => 'nullable|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $validator->errors()], 422);
        }

        $node->update($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'IoT Node updated successfully',
            'data' => $node
        ]);
    }

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
