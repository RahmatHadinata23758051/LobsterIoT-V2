<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Operator;
use Illuminate\Support\Facades\Validator;

class OperatorController extends Controller
{
    /**
     * Display a listing of the operators.
     */
    public function index()
    {
        $operators = Operator::all();
        return $this->success('Operators retrieved successfully', $operators);
    }

    /**
     * Store a newly created operator in storage.
     */
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
