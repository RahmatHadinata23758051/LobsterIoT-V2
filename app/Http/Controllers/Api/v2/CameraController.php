<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Camera;
use Illuminate\Support\Facades\Validator;

class CameraController extends Controller
{
    /**
     * Display a listing of the cameras.
     */
    public function index()
    {
        $cameras = Camera::with('cage')->get();
        return $this->success('Cameras retrieved successfully', $cameras);
    }

    /**
     * Store a newly created camera in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'camera_code' => 'required|string|max:50|unique:cameras,camera_code',
            'cage_id' => 'required|integer|exists:cages,id',
            'stream_url' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $camera = Camera::create([
            'camera_code' => $request->camera_code,
            'cage_id' => $request->cage_id,
            'stream_url' => $request->stream_url,
            'is_active' => $request->is_active ?? false,
        ]);

        return $this->success('Camera created successfully', $camera->load('cage'), 201);
    }

    /**
     * Display the specified camera.
     */
    public function show($id)
    {
        $camera = Camera::with('cage')->find($id);

        if (!$camera) {
            return $this->error('Camera tidak ditemukan.', null, 404);
        }

        return $this->success('Camera retrieved successfully', $camera);
    }

    /**
     * Update the specified camera in storage.
     */
    public function update(Request $request, $id)
    {
        $camera = Camera::find($id);

        if (!$camera) {
            return $this->error('Camera tidak ditemukan.', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'camera_code' => 'sometimes|required|string|max:50|unique:cameras,camera_code,' . $id,
            'cage_id' => 'sometimes|required|integer|exists:cages,id',
            'stream_url' => 'nullable|string|max:255',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $camera->update($request->only([
            'camera_code',
            'cage_id',
            'stream_url',
            'is_active',
        ]));

        return $this->success('Camera updated successfully', $camera->load('cage'));
    }

    /**
     * Remove the specified camera from storage.
     */
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
