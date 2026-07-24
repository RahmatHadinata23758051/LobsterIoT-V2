<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Camera;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class CameraController extends Controller
{
    /**
     * Display a listing of the cameras.
     */
    #[OA\Get(
        path: "/api/v2/cameras",
        summary: "Daftar Semua Kamera",
        description: "Mengambil seluruh data kamera pengawas yang terdaftar beserta relasi IoT Node & Cage.",
        tags: ["Cameras"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar kamera berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function index()
    {
        $cameras = Camera::with('iotNode.cage')->get();
        return $this->success('Cameras retrieved successfully', $cameras);
    }

    /**
     * Store a newly created camera in storage.
     */
    #[OA\Post(
        path: "/api/v2/cameras",
        summary: "Tambah Kamera Baru",
        description: "Mendaftarkan kamera pengawas baru dan menghubungkannya ke IoT Node.",
        tags: ["Cameras"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["camera_code", "iot_node_id"],
                properties: [
                    new OA\Property(property: "camera_code", type: "string", example: "CAM-A01"),
                    new OA\Property(property: "iot_node_id", type: "integer", example: 1),
                    new OA\Property(property: "stream_url", type: "string", format: "url", example: "rtsp://192.168.1.100:554/stream"),
                    new OA\Property(property: "is_active", type: "boolean", example: true)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Kamera berhasil ditambahkan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'camera_code' => 'required|string|max:50|unique:cameras,camera_code',
            'iot_node_id' => 'required|integer|exists:iot_nodes,id',
            'stream_url' => 'nullable|url|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $camera = Camera::create([
            'camera_code' => $request->camera_code,
            'iot_node_id' => $request->iot_node_id,
            'stream_url' => $request->stream_url,
            'is_active' => $request->is_active ?? false,
        ]);

        return $this->success('Camera created successfully', $camera->load('iotNode.cage'), 201);
    }

    /**
     * Display the specified camera.
     */
    #[OA\Get(
        path: "/api/v2/cameras/{id}",
        summary: "Detail Kamera",
        description: "Mengambil detail data satu kamera berdasarkan ID.",
        tags: ["Cameras"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail kamera berhasil diambil"),
            new OA\Response(response: 404, description: "Kamera tidak ditemukan")
        ]
    )]
    public function show($id)
    {
        $camera = Camera::with('iotNode.cage')->find($id);

        if (!$camera) {
            return $this->error('Camera tidak ditemukan.', null, 404);
        }

        return $this->success('Camera retrieved successfully', $camera);
    }

    /**
     * Update the specified camera in storage.
     */
    #[OA\Put(
        path: "/api/v2/cameras/{id}",
        summary: "Update Kamera",
        description: "Memperbarui data kamera pengawas yang sudah ada.",
        tags: ["Cameras"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "camera_code", type: "string", example: "CAM-B02"),
                    new OA\Property(property: "iot_node_id", type: "integer", example: 2),
                    new OA\Property(property: "stream_url", type: "string", format: "url", example: "rtsp://192.168.1.101:554/stream"),
                    new OA\Property(property: "is_active", type: "boolean", example: false)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Kamera berhasil diperbarui"),
            new OA\Response(response: 404, description: "Kamera tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function update(Request $request, $id)
    {
        $camera = Camera::find($id);

        if (!$camera) {
            return $this->error('Camera tidak ditemukan.', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'camera_code' => 'sometimes|required|string|max:50|unique:cameras,camera_code,' . $id,
            'iot_node_id' => 'sometimes|required|integer|exists:iot_nodes,id',
            'stream_url' => 'nullable|url|max:255',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $camera->update($request->only([
            'camera_code',
            'iot_node_id',
            'stream_url',
            'is_active',
        ]));

        return $this->success('Camera updated successfully', $camera->load('iotNode.cage'));
    }

    /**
     * Remove the specified camera from storage.
     */
    #[OA\Delete(
        path: "/api/v2/cameras/{id}",
        summary: "Hapus Kamera",
        description: "Menghapus data kamera pengawas berdasarkan ID.",
        tags: ["Cameras"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Kamera berhasil dihapus"),
            new OA\Response(response: 404, description: "Kamera tidak ditemukan")
        ]
    )]
    public function destroy($id)
    {
        $camera = Camera::find($id);

        if (!$camera) {
            return $this->error('Camera tidak ditemukan.', null, 404);
        }

        $camera->delete();

        return $this->success('Camera deleted successfully');
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
