<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Province;
use App\Models\City;

class RegionController extends Controller
{
    /**
     * Display a listing of provinces.
     */
    public function provinces()
    {
        $provinces = Province::all();
        return $this->success('Provinces retrieved successfully', $provinces);
    }

    /**
     * Display a listing of cities.
     * Optionally filtered by province_id query parameter.
     */
    public function cities(Request $request)
    {
        $query = City::query();

        if ($request->has('province_id')) {
            $query->where('province_id', $request->province_id);
        }

        $cities = $query->with('province')->get();

        return $this->success('Cities retrieved successfully', $cities);
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
}
