<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\City;
use App\Models\Province;
use App\Models\IotNode;
use App\Models\Threshold;
use App\Models\SensorType;
use App\Services\InfluxDBService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Mockery;

class MonitoringApiTest extends TestCase
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

        // Seed default sensor types for foreign key checks
        SensorType::create([
            'sensor_code' => 'ph',
            'value_range' => '6.5 - 8.5',
            'description' => 'pH Sensor'
        ]);
    }

    /**
     * Test monitoring routes require authentication.
     */
    public function test_monitoring_routes_require_auth(): void
    {
        $this->getJson('/api/v2/iot-nodes')->assertStatus(401);
        $this->getJson('/api/v2/monitoring/dashboard/NODE-001')->assertStatus(401);
        $this->getJson('/api/v2/monitoring/history/NODE-001')->assertStatus(401);
    }

    /**
     * Test activeNodes returns only activated nodes with city details.
     */
    public function test_get_active_nodes_success(): void
    {
        // 1. Activated Node
        IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-ACTIVE-001',
            'activated_at' => now(),
            'latitude' => -7.123,
            'longitude' => 108.456,
        ]);

        // 2. Unactivated Node (should be excluded)
        IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-INACTIVE-002',
            'activated_at' => null,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/iot-nodes');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Activated nodes retrieved',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'serial_number' => 'NODE-ACTIVE-001',
                'latitude' => -7.12300000,
                'longitude' => 108.45600000,
            ])
            ->assertJsonMissing([
                'serial_number' => 'NODE-INACTIVE-002'
            ]);
    }

    /**
     * Test dashboard query returns consolidated telemetry and threshold config.
     */
    public function test_get_dashboard_data_success(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'SN-DASH-100',
            'activated_at' => now(),
        ]);

        $threshold = Threshold::create([
            'iot_node_serial_number' => 'SN-DASH-100',
            'sensor_code' => 'ph',
            'value_min' => 6.5,
            'value_max' => 8.5,
            'offset_value' => 0.0,
        ]);

        // Mock InfluxDB queryParsed response
        $mockLatest = [
            'time' => '2026-06-24T10:00:00Z',
            'ph' => 7.2,
            'tds' => 250.0,
            'water_temperature' => 26.5
        ];

        $mockSeries = [
            [
                'time' => '2026-06-24T09:50:00Z',
                'ph' => 7.1,
                'tds' => 245.0,
                'water_temperature' => 26.3
            ],
            [
                'time' => '2026-06-24T09:55:00Z',
                'ph' => 7.2,
                'tds' => 248.0,
                'water_temperature' => 26.4
            ]
        ];

        $this->mock(InfluxDBService::class, function (MockInterface $mock) use ($mockLatest, $mockSeries) {
            // First call retrieves latest point
            $mock->shouldReceive('queryParsed')
                ->with(Mockery::on(fn($q) => str_contains($q, 'tail(n: 1)')))
                ->once()
                ->andReturn([$mockLatest]);

            // Second call retrieves 24h series
            $mock->shouldReceive('queryParsed')
                ->with(Mockery::on(fn($q) => str_contains($q, 'aggregateWindow')))
                ->once()
                ->andReturn($mockSeries);
        });

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/monitoring/dashboard/SN-DASH-100');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Dashboard data compiled',
                'data' => [
                    'latest' => $mockLatest,
                    'series_24h' => $mockSeries,
                    'thresholds' => [
                        [
                            'sensor_code' => 'ph',
                            'value_min' => '6.50',
                            'value_max' => '8.50'
                        ]
                    ]
                ]
            ]);
    }

    /**
     * Test dashboard returns 404 for non-existent serial number.
     */
    public function test_get_dashboard_not_found(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/monitoring/dashboard/UNKNOWN-SERIAL-999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'IoT Node tidak ditemukan.'
            ]);
    }

    /**
     * Test historical telemetry retrieval.
     */
    public function test_get_history_data_success(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'SN-HIST-200',
            'activated_at' => now(),
        ]);

        $mockHistory = [
            [
                'time' => '2026-06-01T12:00:00Z',
                'ph' => 7.3,
                'tds' => 260.0,
                'water_temperature' => 26.2
            ]
        ];

        $this->mock(InfluxDBService::class, function (MockInterface $mock) use ($mockHistory) {
            $mock->shouldReceive('queryParsed')
                ->with(Mockery::on(fn($q) => str_contains($q, 'range(start: 2026-06-01T00:00:00Z, stop: 2026-06-07T23:59:59Z)')))
                ->once()
                ->andReturn($mockHistory);
        });

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/monitoring/history/SN-HIST-200?startDate=2026-06-01&endDate=2026-06-07&limit=50');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Historical data retrieved',
                'data' => [
                    'startDate' => '2026-06-01',
                    'endDate' => '2026-06-07',
                    'telemetries' => $mockHistory
                ]
            ]);
    }

    /**
     * Test history validation failure for invalid date format.
     */
    public function test_get_history_validation_error(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'SN-HIST-200',
            'activated_at' => now(),
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/monitoring/history/SN-HIST-200?startDate=invalid-date&endDate=2026-06-07');

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi tanggal gagal.'
            ]);
    }
}
