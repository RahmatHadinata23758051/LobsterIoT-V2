<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Operator;
use Illuminate\Support\Facades\Validator;

use OpenApi\Attributes as OA;

class OperatorController extends Controller
{
    /**
     * Display a listing of the operators.
     */
    #[OA\Get(
        path: "/api/v2/operators",
        summary: "Daftar Semua Operator",
        description: "Mengambil seluruh data operator lapangan yang terdaftar.",
        tags: ["Operators"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Daftar operator berhasil diambil"),
            new OA\Response(response: 401, description: "Tidak terautentikasi")
        ]
    )]
    public function index()
    {
        $operators = Operator::all();
        return $this->success('Operators retrieved successfully', $operators);
    }

    /**
     * Store a newly created operator in storage.
     */
    #[OA\Post(
        path: "/api/v2/operators",
        summary: "Tambah Operator Baru",
        description: "Mendaftarkan operator lapangan baru ke dalam sistem.",
        tags: ["Operators"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["full_name", "phone_number", "address"],
                properties: [
                    new OA\Property(property: "full_name", type: "string", example: "Budi Setiawan"),
                    new OA\Property(property: "phone_number", type: "string", example: "081234567890"),
                    new OA\Property(property: "address", type: "string", example: "Jl. Pantai Indah No. 12, Mataram")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Operator berhasil ditambahkan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:150',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $operator = Operator::create([
            'full_name' => $request->full_name,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
        ]);

        return $this->success('Operator created successfully', $operator, 201);
    }

    /**
     * Display the specified operator.
     */
    #[OA\Get(
        path: "/api/v2/operators/{id}",
        summary: "Detail Operator",
        description: "Mengambil detail data satu operator berdasarkan ID.",
        tags: ["Operators"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail operator berhasil diambil"),
            new OA\Response(response: 404, description: "Operator tidak ditemukan")
        ]
    )]
    public function show($id)
    {
        $operator = Operator::find($id);

        if (!$operator) {
            return $this->error('Operator tidak ditemukan.', null, 404);
        }

        return $this->success('Operator retrieved successfully', $operator);
    }

    /**
     * Update the specified operator in storage.
     */
    #[OA\Put(
        path: "/api/v2/operators/{id}",
        summary: "Update Operator",
        description: "Memperbarui data operator lapangan yang sudah ada.",
        tags: ["Operators"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "full_name", type: "string", example: "Budi Setiawan"),
                    new OA\Property(property: "phone_number", type: "string", example: "081234567890"),
                    new OA\Property(property: "address", type: "string", example: "Jl. Pantai Indah No. 15, Mataram")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Operator berhasil diperbarui"),
            new OA\Response(response: 404, description: "Operator tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
    public function update(Request $request, $id)
    {
        $operator = Operator::find($id);

        if (!$operator) {
            return $this->error('Operator tidak ditemukan.', null, 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:150',
            'phone_number' => 'sometimes|required|string|max:20',
            'address' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $operator->update($request->only([
            'full_name',
            'phone_number',
            'address',
        ]));

        return $this->success('Operator updated successfully', $operator);
    }

    /**
     * Remove the specified operator from storage.
     */
    #[OA\Delete(
        path: "/api/v2/operators/{id}",
        summary: "Hapus Operator",
        description: "Menghapus data operator berdasarkan ID.",
        tags: ["Operators"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer", example: 1))
        ],
        responses: [
            new OA\Response(response: 200, description: "Operator berhasil dihapus"),
            new OA\Response(response: 404, description: "Operator tidak ditemukan")
        ]
    )]
    public function destroy($id)
    {
        $operator = Operator::find($id);

        if (!$operator) {
            return $this->error('Operator tidak ditemukan.', null, 404);
        }

        $operator->delete();

        return $this->success('Operator deleted successfully');
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
