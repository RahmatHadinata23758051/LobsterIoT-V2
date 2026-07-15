<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cage;
use Illuminate\Support\Facades\Validator;

class CageController extends Controller
{
    /**
     * Display a listing of the cages.
     */
    public function index()
    {
        $cages = Cage::all();
        return $this->success('Cages retrieved successfully', $cages);
    }

    /**
     * Store a newly created cage in storage.
     */
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
