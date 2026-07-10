<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SystemSetting;

class SystemSettingController extends Controller
{
    /**
     * Get all system settings.
     */
    public function index()
    {
        $settings = SystemSetting::pluck('value', 'key');
        return $this->success('System settings retrieved successfully', $settings);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'system_latitude' => 'nullable|numeric',
            'system_longitude' => 'nullable|numeric',
            'system_city_name' => 'nullable|string',
            'system_province_code' => 'nullable|string',
            'system_city_code' => 'nullable|string',
            'system_district_code' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Trigger weather update for the new coordinates immediately to update dashboard
        $lat = SystemSetting::where('key', 'system_latitude')->value('value');
        $lon = SystemSetting::where('key', 'system_longitude')->value('value');
        $cityName = SystemSetting::where('key', 'system_city_name')->value('value');

        if ($lat && $lon && $cityName) {
            try {
                $weatherService = app(\App\Services\WeatherService::class);
                $weatherService->fetchFromCoordinates($lat, $lon, $cityName);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to update weather on setting save: " . $e->getMessage());
            }
        }

        $settings = SystemSetting::pluck('value', 'key');
        return $this->success('System settings updated successfully', $settings);
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
