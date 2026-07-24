<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IotNode;
use App\Models\EdgeGateway;
use App\Models\Maintenance;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class DeviceOperationController extends Controller
{
    /**
     * Validate serial number.
     */
    #[OA\Post(
        path: "/api/v2/devices/validate-serial",
        summary: "Validasi Nomor Seri Perangkat Pabrikan",
        tags: ["Device Operations"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["category", "serial_number"],
                properties: [
                    new OA\Property(property: "category", type: "string", enum: ["iot_node", "edge_gateway"], example: "iot_node"),
                    new OA\Property(property: "serial_number", type: "string", example: "LOB-NODE-001"),
                    new OA\Property(property: "is_maintenance", type: "boolean", example: false)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Hasil validasi keabsahan nomor seri"),
            new OA\Response(response: 404, description: "Nomor seri tidak ditemukan")
        ]
    )]
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
    #[OA\Post(
        path: "/api/v2/devices/activate",
        summary: "Aktivasi Perangkat IoT",
        description: "Mengaktivasi perangkat IoT Node atau Edge Gateway dengan upload foto dan tanda tangan.",
        tags: ["Device Operations"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["category", "id", "picture", "signature", "latitude", "longitude"],
                    properties: [
                        new OA\Property(property: "category", type: "string", enum: ["iot_node", "edge_gateway"]),
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "picture", type: "string", format: "binary"),
                        new OA\Property(property: "signature", type: "string", format: "binary"),
                        new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                        new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456)
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Perangkat berhasil diaktivasi"),
            new OA\Response(response: 404, description: "Perangkat tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function activate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|string|in:iot_node,edge_gateway',
            'id' => 'required|integer',
            'picture' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'signature' => 'required|image|mimes:png,jpeg,jpg|max:5120',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
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
    #[OA\Post(
        path: "/api/v2/maintenances",
        summary: "Catat Log Pemeliharaan",
        description: "Mengirimkan laporan pemeliharaan perangkat IoT beserta foto dan tanda tangan operator.",
        tags: ["Device Operations"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["iot_node_id", "description", "signature", "latitude", "longitude"],
                    properties: [
                        new OA\Property(property: "iot_node_id", type: "integer", example: 1),
                        new OA\Property(property: "description", type: "string", example: "Pembersihan sensor pH dan kalibrasi ulang"),
                        new OA\Property(property: "picture", type: "string", format: "binary"),
                        new OA\Property(property: "signature", type: "string", format: "binary"),
                        new OA\Property(property: "latitude", type: "number", format: "double", example: -8.123),
                        new OA\Property(property: "longitude", type: "number", format: "double", example: 115.456)
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Log pemeliharaan berhasil dicatat"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function submitMaintenance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'iot_node_id' => 'required|integer|exists:iot_nodes,id',
            'description' => 'required|string',
            'picture' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'signature' => 'required|image|mimes:png,jpeg,jpg|max:5120',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
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
    #[OA\Get(
        path: "/api/v2/maintenances",
        summary: "Daftar Log Pemeliharaan",
        description: "Mengambil seluruh riwayat log pemeliharaan perangkat beserta relasi IoT Node dan Operator.",
        tags: ["Device Operations"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar log pemeliharaan berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
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
