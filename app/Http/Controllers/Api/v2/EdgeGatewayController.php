<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EdgeGateway;
use Illuminate\Support\Facades\Validator;

class EdgeGatewayController extends Controller
{
    public function index()
    {
        $gateways = EdgeGateway::with(['city'])->get();
        return response()->json([
            'status' => 'success',
            'message' => 'Edge Gateways retrieved successfully',
            'data' => $gateways
        ]);
    }

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
            'ip_address' => 'nullable|string|max:45',
            'gateway_ip' => 'nullable|string|max:45',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'max_connected_nodes' => 'nullable|integer'
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

    public function show($id)
    {
        $gateway = EdgeGateway::with(['city'])->find($id);
        if (!$gateway) {
            return response()->json(['status' => 'error', 'message' => 'Edge Gateway tidak ditemukan.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $gateway]);
    }

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
            'ip_address' => 'nullable|string|max:45',
            'gateway_ip' => 'nullable|string|max:45',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'max_connected_nodes' => 'nullable|integer'
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
