<?php

namespace App\Services;

use App\Models\City;
use App\Models\WeatherReport;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherService
{
    protected ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openweather.key');
    }

    /**
     * Synchronize weather for all cities in the database.
     */
    public function syncAllCities(): int
    {
        if (empty($this->apiKey)) {
            Log::error('OpenWeather API key is not configured.');
            return 0;
        }

        // Sync main farm location from settings
        $latSetting = \App\Models\SystemSetting::find('system_latitude');
        $lonSetting = \App\Models\SystemSetting::find('system_longitude');
        $citySetting = \App\Models\SystemSetting::find('system_city_name');

        if ($latSetting && $lonSetting && $citySetting) {
            try {
                $this->fetchFromCoordinates(
                    $latSetting->value,
                    $lonSetting->value,
                    $citySetting->value
                );
            } catch (\Exception $e) {
                Log::error("Failed to sync weather for system coordinates: " . $e->getMessage());
            }
        }

        $cities = City::with('province')->get();
        $syncedCount = 0;

        foreach ($cities as $city) {
            try {
                $report = $this->fetchFromApi($city);
                if ($report) {
                    $syncedCount++;
                }
            } catch (\Exception $e) {
                Log::error("Failed to sync weather for city [{$city->name}]: " . $e->getMessage());
            }
        }

        return $syncedCount;
    }

    /**
     * Fetch weather from OpenWeather API using coordinates and save it.
     */
    public function fetchFromCoordinates(string $lat, string $lon, string $cityName): ?WeatherReport
    {
        if (empty($this->apiKey)) {
            Log::warning("OpenWeather API key is not configured. Creating placeholder weather report.");
            return WeatherReport::updateOrCreate(
                [
                    'province_code' => 'SYSTEM',
                    'city_code' => 'SYSTEM',
                    'district_code' => 'SYSTEM',
                    'village_code' => 'SYSTEM',
                ],
                [
                    'village_name' => '--',
                    'district_name' => '--',
                    'city_name' => $cityName,
                    'province_name' => 'SYSTEM',
                    'temperature' => '28',
                    'humidity' => '70',
                    'wind_speed' => '3.5',
                    'rainfall' => '0',
                    'weather_description' => 'Cerah',
                    'icon_url' => null,
                ]
            );
        }

        try {
            $response = Http::withoutVerifying()->get("https://api.openweathermap.org/data/2.5/weather", [
                'lat' => $lat,
                'lon' => $lon,
                'appid' => $this->apiKey,
                'units' => 'metric'
            ]);

            if (!$response->successful()) {
                Log::warning("OpenWeather API returned status {$response->status()} for coordinates {$lat}, {$lon}");
                return WeatherReport::updateOrCreate(
                    [
                        'province_code' => 'SYSTEM',
                        'city_code' => 'SYSTEM',
                        'district_code' => 'SYSTEM',
                        'village_code' => 'SYSTEM',
                    ],
                    [
                        'village_name' => '--',
                        'district_name' => '--',
                        'city_name' => $cityName,
                        'province_name' => 'SYSTEM',
                        'temperature' => '28',
                        'humidity' => '70',
                        'wind_speed' => '3.5',
                        'rainfall' => '0',
                        'weather_description' => 'Cerah',
                        'icon_url' => null,
                    ]
                );
            }

            $data = $response->json();

            $temperature = isset($data['main']['temp']) ? (string)$data['main']['temp'] : '28';
            $humidity = isset($data['main']['humidity']) ? (string)$data['main']['humidity'] : '70';
            $windSpeed = isset($data['wind']['speed']) ? (string)$data['wind']['speed'] : '3.5';
            
            $rainfall = '0';
            if (isset($data['rain'])) {
                if (isset($data['rain']['1h'])) {
                    $rainfall = (string)$data['rain']['1h'];
                } elseif (isset($data['rain']['3h'])) {
                    $rainfall = (string)$data['rain']['3h'];
                }
            }

            $weatherDesc = isset($data['weather'][0]['description']) ? $data['weather'][0]['description'] : 'Cerah';
            $iconCode = isset($data['weather'][0]['icon']) ? $data['weather'][0]['icon'] : null;
            $iconUrl = $iconCode ? "https://openweathermap.org/img/wn/{$iconCode}@2x.png" : null;

            return WeatherReport::updateOrCreate(
                [
                    'province_code' => 'SYSTEM',
                    'city_code' => 'SYSTEM',
                    'district_code' => 'SYSTEM',
                    'village_code' => 'SYSTEM',
                ],
                [
                    'village_name' => '--',
                    'district_name' => '--',
                    'city_name' => $cityName,
                    'province_name' => 'SYSTEM',
                    'temperature' => $temperature,
                    'humidity' => $humidity,
                    'wind_speed' => $windSpeed,
                    'rainfall' => $rainfall,
                    'weather_description' => $weatherDesc,
                    'icon_url' => $iconUrl,
                ]
            );
        } catch (\Exception $e) {
            Log::error("Failed to fetch weather from coordinates: " . $e->getMessage());
            return WeatherReport::updateOrCreate(
                [
                    'province_code' => 'SYSTEM',
                    'city_code' => 'SYSTEM',
                    'district_code' => 'SYSTEM',
                    'village_code' => 'SYSTEM',
                ],
                [
                    'village_name' => '--',
                    'district_name' => '--',
                    'city_name' => $cityName,
                    'province_name' => 'SYSTEM',
                    'temperature' => '28',
                    'humidity' => '70',
                    'wind_speed' => '3.5',
                    'rainfall' => '0',
                    'weather_description' => 'Cerah',
                    'icon_url' => null,
                ]
            );
        }
    }

    /**
     * Fetch weather from OpenWeather API for a specific city and save it to the database.
     */
    public function fetchFromApi(City $city): ?WeatherReport
    {
        $cityName = $city->name;
        
        // Query OpenWeather API by city name
        $response = Http::withoutVerifying()->get("https://api.openweathermap.org/data/2.5/weather", [
            'q' => "{$cityName},ID",
            'appid' => $this->apiKey,
            'units' => 'metric'
        ]);

        if (!$response->successful()) {
            Log::warning("OpenWeather API returned status {$response->status()} for city {$cityName}");
            return null;
        }

        $data = $response->json();

        $temperature = isset($data['main']['temp']) ? (string)$data['main']['temp'] : '--';
        $humidity = isset($data['main']['humidity']) ? (string)$data['main']['humidity'] : '--';
        $windSpeed = isset($data['wind']['speed']) ? (string)$data['wind']['speed'] : '--';
        
        $rainfall = '0';
        if (isset($data['rain'])) {
            if (isset($data['rain']['1h'])) {
                $rainfall = (string)$data['rain']['1h'];
            } elseif (isset($data['rain']['3h'])) {
                $rainfall = (string)$data['rain']['3h'];
            }
        }

        $weatherDesc = isset($data['weather'][0]['description']) ? $data['weather'][0]['description'] : '--';
        $iconCode = isset($data['weather'][0]['icon']) ? $data['weather'][0]['icon'] : null;
        $iconUrl = $iconCode ? "https://openweathermap.org/img/wn/{$iconCode}@2x.png" : null;

        // Upsert weather report for this city
        $weatherReport = WeatherReport::updateOrCreate(
            [
                'province_code' => $city->province->code,
                'city_code' => $city->code,
                'district_code' => $city->code . '00', // default fallback
                'village_code' => $city->code . '000000', // default fallback
            ],
            [
                'village_name' => '--',
                'district_name' => '--',
                'city_name' => $city->name,
                'province_name' => $city->province->name,
                'temperature' => $temperature,
                'humidity' => $humidity,
                'wind_speed' => $windSpeed,
                'rainfall' => $rainfall,
                'icon_url' => $iconUrl,
                'weather_description' => $weatherDesc,
            ]
        );

        return $weatherReport;
    }
}
