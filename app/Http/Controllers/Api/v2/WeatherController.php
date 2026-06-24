<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WeatherReport;

class WeatherController extends Controller
{
    /**
     * Display the latest weather reports.
     */
    public function latest(Request $request)
    {
        $query = WeatherReport::query();

        if ($request->has('city_code')) {
            $query->where('city_code', $request->city_code);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        return $this->success('Latest weather reports retrieved successfully', $reports);
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
