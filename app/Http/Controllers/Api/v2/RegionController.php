<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;

class RegionController extends Controller
{
    /**
     * Display a listing of provinces.
     */
    public function provinces()
    {
        $provinces = Province::orderBy('name', 'asc')->get();
        return $this->success('Provinces retrieved successfully', $provinces);
    }

    /**
     * Display a listing of cities.
     */
    public function cities(Request $request)
    {
        $query = City::query();

        if ($request->has('province_code')) {
            $query->where('province_code', $request->province_code);
        }

        $cities = $query->orderBy('name', 'asc')->get();

        return $this->success('Cities retrieved successfully', $cities);
    }

    /**
     * Display a listing of districts.
     */
    public function districts(Request $request)
    {
        $query = District::query();

        if ($request->has('city_code')) {
            $query->where('city_code', $request->city_code);
        }

        $districts = $query->orderBy('name', 'asc')->get();

        return $this->success('Districts retrieved successfully', $districts);
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
