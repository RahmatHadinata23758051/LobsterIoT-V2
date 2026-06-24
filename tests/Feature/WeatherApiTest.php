<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use App\Models\WeatherReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class WeatherApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected City $city;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Operator Lobsense',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
        ]);
        $this->token = $this->user->createToken('test_token')->plainTextToken;

        $province = Province::create([
            'code' => '32',
            'name' => 'JAWA BARAT',
        ]);

        $this->city = City::create([
            'province_id' => $province->id,
            'code' => '3209',
            'name' => 'CIREBON',
        ]);

        // Configure OpenWeather key for testing
        config(['services.openweather.key' => 'test-api-key']);
    }

    /**
     * Test weather route requires authentication.
     */
    public function test_weather_routes_require_auth(): void
    {
        $this->getJson('/api/v2/weather/latest')->assertStatus(401);
    }

    /**
     * Test weather sync command successfully pulls data from OpenWeather and updates the DB.
     */
    public function test_weather_sync_command_success(): void
    {
        // Mock OpenWeather API response
        Http::fake([
            'api.openweathermap.org/*' => Http::response([
                'coord' => ['lon' => 108.56, 'lat' => -6.7],
                'weather' => [
                    [
                        'id' => 801,
                        'main' => 'Clouds',
                        'description' => 'few clouds',
                        'icon' => '02d'
                    ]
                ],
                'main' => [
                    'temp' => 29.5,
                    'humidity' => 65
                ],
                'wind' => [
                    'speed' => 4.2
                ],
                'name' => 'Cirebon'
            ], 200)
        ]);

        // Run artisan command
        $this->artisan('weather:sync')
            ->expectsOutput('Starting OpenWeather synchronization...')
            ->expectsOutput('Successfully synchronized weather reports for 1 cities.')
            ->assertExitCode(0);

        // Verify database entry
        $this->assertDatabaseHas('weather_reports', [
            'province_code' => '32',
            'city_code' => '3209',
            'city_name' => 'CIREBON',
            'temperature' => '29.5',
            'humidity' => '65',
            'wind_speed' => '4.2',
            'weather_description' => 'few clouds',
            'icon_url' => 'https://openweathermap.org/img/wn/02d@2x.png',
        ]);
    }

    /**
     * Test retrieving the latest weather reports.
     */
    public function test_get_latest_weather_success(): void
    {
        WeatherReport::create([
            'province_code' => '32',
            'city_code' => '3209',
            'district_code' => '320900',
            'village_code' => '3209000000',
            'city_name' => 'CIREBON',
            'province_name' => 'JAWA BARAT',
            'temperature' => '28.0',
            'humidity' => '70',
            'wind_speed' => '3.5',
            'rainfall' => '0',
            'weather_description' => 'scattered clouds',
            'icon_url' => 'https://openweathermap.org/img/wn/03d@2x.png',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/weather/latest');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Latest weather reports retrieved successfully',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'city_name' => 'CIREBON',
                'temperature' => '28.0',
                'weather_description' => 'scattered clouds'
            ]);
    }

    /**
     * Test retrieving latest weather reports filtered by city_code.
     */
    public function test_get_latest_weather_filtered(): void
    {
        WeatherReport::create([
            'province_code' => '32',
            'city_code' => '3209',
            'district_code' => '320900',
            'village_code' => '3209000000',
            'city_name' => 'CIREBON',
            'province_name' => 'JAWA BARAT',
            'temperature' => '28.0',
        ]);

        WeatherReport::create([
            'province_code' => '32',
            'city_code' => '3201',
            'district_code' => '320100',
            'village_code' => '3201000000',
            'city_name' => 'BOGOR',
            'province_name' => 'JAWA BARAT',
            'temperature' => '25.0',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/weather/latest?city_code=3209');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['city_name' => 'CIREBON'])
            ->assertJsonMissing(['city_name' => 'BOGOR']);
    }
}
