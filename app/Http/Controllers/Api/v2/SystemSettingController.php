<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SystemSetting;

use OpenApi\Attributes as OA;

class SystemSettingController extends Controller
{
    /**
     * Get all system settings.
     */
    #[OA\Get(
        path: "/api/v2/system-settings",
        summary: "Pengaturan Sistem",
        description: "Mengambil seluruh pengaturan sistem termasuk lokasi, logo, dan konfigurasi.",
        tags: ["System Settings"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Pengaturan sistem berhasil diambil")
        ]
    )]
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
    #[OA\Post(
        path: "/api/v2/system-settings",
        summary: "Update Pengaturan Sistem",
        description: "Memperbarui pengaturan sistem termasuk lokasi, nama instansi, dan upload logo.",
        tags: ["System Settings"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "system_latitude", type: "number", format: "double", example: -8.583),
                        new OA\Property(property: "system_longitude", type: "number", format: "double", example: 116.116),
                        new OA\Property(property: "system_city_name", type: "string", example: "Lombok Barat"),
                        new OA\Property(property: "system_province_code", type: "string", example: "52"),
                        new OA\Property(property: "system_city_code", type: "string", example: "5201"),
                        new OA\Property(property: "system_district_code", type: "string", example: "520101"),
                        new OA\Property(property: "system_logo_text", type: "string", example: "Lobsense"),
                        new OA\Property(property: "system_instansi_name", type: "string", example: "PT Lobster Sensing Indonesia"),
                        new OA\Property(property: "system_logo_file", type: "string", format: "binary"),
                        new OA\Property(property: "logo_file", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Pengaturan berhasil diperbarui"),
            new OA\Response(response: 422, description: "Validasi gagal")
        ]
    )]
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
