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
        $settings = SystemSetting::pluck('value', 'key')->toArray();
        if (!empty($settings['system_logo_image'])) {
            $settings['system_logo_url'] = asset('storage/' . $settings['system_logo_image']);
        } else {
            $settings['system_logo_url'] = null;
        }

        return $this->success('System settings retrieved successfully', $settings);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'system_latitude' => 'nullable',
            'system_longitude' => 'nullable',
            'system_city_name' => 'nullable|string',
            'system_province_code' => 'nullable|string',
            'system_city_code' => 'nullable|string',
            'system_district_code' => 'nullable|string',
            'system_logo_text' => 'nullable|string',
            'system_instansi_name' => 'nullable|string',
            'system_logo_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:5120',
            'logo_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:5120',
        ]);

        foreach ($validated as $key => $value) {
            if ($key === 'system_logo_file' || $key === 'logo_file') {
                continue;
            }
            if ($value !== null) {
                SystemSetting::updateOrCreate(
                    ['key' => $key],
                    ['value' => (string) $value]
                );
            }
        }

        // Handle image file upload for system logo
        if ($request->hasFile('system_logo_file') || $request->hasFile('logo_file')) {
            $file = $request->file('system_logo_file') ?? $request->file('logo_file');
            $path = $file->store('branding', 'public');
            SystemSetting::updateOrCreate(
                ['key' => 'system_logo_image'],
                ['value' => $path]
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

        $settings = SystemSetting::pluck('value', 'key')->toArray();
        if (!empty($settings['system_logo_image'])) {
            $settings['system_logo_url'] = asset('storage/' . $settings['system_logo_image']);
        } else {
            $settings['system_logo_url'] = null;
        }

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
