<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Province;
use App\Models\City;
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
            $query->whereHas('province', function ($q) use ($request) {
                $q->where('code', $request->province_code);
            });
        }

        if ($request->has('province_id')) {
            $query->where('province_id', $request->province_id);
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
