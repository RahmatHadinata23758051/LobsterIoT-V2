<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IotNode;
use App\Models\EdgeGateway;
use App\Models\Maintenance;
use Illuminate\Support\Facades\Validator;

class DeviceOperationController extends Controller
{
    /**
     * Validate serial number.
     */
    public function validateSerial(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|in:iot_node,edge_gateway',
            'serial_number' => 'required|string',
            'is_maintenance' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $category = $request->category;
        $serial = $request->serial_number;
        $isMaintenance = (bool) $request->is_maintenance;

        if ($category === 'iot_node') {
            $device = IotNode::where('serial_number', $serial)->first();
        } else {
            $device = EdgeGateway::where('serial_number', $serial)->first();
        }

        if (!$device) {
            return $this->error('Nomor seri tidak ditemukan.', null, 404);
        }

        $isActivated = !is_null($device->activated_at);

        if ($isMaintenance && !$isActivated) {
            return $this->error('Alat belum diaktivasi. Tidak dapat mengajukan pemeliharaan.', null, 400);
        }

        return $this->success('Serial number is valid.', [
            'id' => $device->id,
            'category' => $category,
            'serial_number' => $device->serial_number,
            'is_activated' => $isActivated,
        ]);
    }

    /**
     * Register & activate device.
     */
    public function activate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|in:iot_node,edge_gateway',
            'id' => 'required|integer',
            'picture' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'signature' => 'required|image|mimes:png,jpeg,jpg|max:5120',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $category = $request->category;
        $id = $request->id;

        if ($category === 'iot_node') {
            $device = IotNode::find($id);
        } else {
            $device = EdgeGateway::find($id);
        }

        if (!$device) {
            return $this->error('Device tidak ditemukan.', null, 404);
        }

        // Store photos
        $picturePath = $request->file('picture')->store('devices', 'public');
        $signaturePath = $request->file('signature')->store('signatures', 'public');

        $device->update([
            'device_photo' => $picturePath,
            'handover_signature' => $signaturePath,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'activated_at' => now(),
            'activated_by' => auth()->id(),
        ]);

        return $this->success('Device activated successfully');
    }

    /**
     * Submit Maintenance log.
     */
    public function submitMaintenance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_id' => 'required|integer|exists:iot_nodes,id',
            'description' => 'required|string',
            'picture' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'signature' => 'required|image|mimes:png,jpeg,jpg|max:5120',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        // Store files
        $picturePath = $request->hasFile('picture') 
            ? $request->file('picture')->store('maintenances', 'public') 
            : null;
        $signaturePath = $request->file('signature')->store('signatures', 'public');

        Maintenance::create([
            'iot_node_id' => $request->iot_node_id,
            'operator_id' => auth()->id(),
            'description' => $request->description,
            'device_photo' => $picturePath,
            'operator_signature' => $signaturePath,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return $this->success('Maintenance log registered successfully', null, 201);
    }

    /**
     * Display a listing of maintenance logs.
     */
    public function indexMaintenance()
    {
        $maintenances = Maintenance::with(['iotNode', 'operator'])->orderBy('created_at', 'desc')->get();
        return $this->success('Maintenance logs retrieved successfully', $maintenances);
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
