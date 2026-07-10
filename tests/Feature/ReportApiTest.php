<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\City;
use App\Models\Province;
use App\Models\EdgeGateway;
use App\Models\IotNode;
use App\Models\Cage;
use App\Models\Operator;
use App\Models\Maintenance;
use App\Models\FeedingLog;
use App\Services\InfluxDBService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected City $city;
    protected EdgeGateway $gateway;
    protected IotNode $node;
    protected Cage $cage;
    protected Operator $operator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Admin Lobsense',
            'email' => 'admin@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
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

        $this->gateway = EdgeGateway::create([
            'serial_number' => 'GW-TEST-999',
            'city_id' => $this->city->id,
        ]);

        $this->node = IotNode::create([
            'serial_number' => 'NODE-TEST-999',
            'city_id' => $this->city->id,
            'edge_gateway_id' => $this->gateway->id,
            'owner_id' => $this->user->id,
            'activated_at' => now(),
            'activated_by' => $this->user->id,
        ]);

        $this->cage = Cage::create([
            'cage_code' => 'KJA-TEST-999',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'volume_cubic_meters' => 10.5,
            'structure_condition' => 'Excellent',
        ]);

        $this->operator = Operator::create([
            'full_name' => 'Petugas Test',
            'phone_number' => '081234567890',
            'address' => 'Jl. Kebon Jeruk',
        ]);

        // Create log records
        Maintenance::create([
            'iot_node_id' => $this->node->id,
            'operator_id' => $this->user->id,
            'description' => 'Pembersihan sensor suhu dan pH',
            'latitude' => -6.2,
            'longitude' => 106.8,
        ]);

        FeedingLog::create([
            'cage_id' => $this->cage->id,
            'operator_id' => $this->operator->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pelet Lobster A',
            'weight_kg' => 2.50,
        ]);
    }

    public function test_reports_require_authentication(): void
    {
        $this->getJson('/api/v2/reports/node-registration/pdf')->assertStatus(401);
        $this->getJson('/api/v2/reports/node-registration/csv')->assertStatus(401);
    }

    public function test_node_registration_pdf_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/node-registration/pdf');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_node_registration_csv_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/node-registration/csv');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('NODE-TEST-999', $response->streamedContent());
    }

    public function test_telemetry_pdf_export(): void
    {
        $mockTelemetry = [
            [
                'iot_node_serial_number' => 'NODE-TEST-999',
                '_time' => '2026-07-10T14:00:00Z',
                'temperature' => 27.5,
                'humidity' => 85,
                'ph' => 7.2,
                'dissolved_oxygen' => 6.5,
                'salinity' => 30.2,
                'turbidity' => 12.4
            ]
        ];

        $this->mock(InfluxDBService::class, function (MockInterface $mock) use ($mockTelemetry) {
            $mock->shouldReceive('queryParsed')
                ->once()
                ->andReturn($mockTelemetry);
        });

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/telemetry/pdf?serial_number=NODE-TEST-999');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_telemetry_csv_export(): void
    {
        $mockTelemetry = [
            [
                'iot_node_serial_number' => 'NODE-TEST-999',
                '_time' => '2026-07-10T14:00:00Z',
                'temperature' => 27.5,
                'humidity' => 85,
                'ph' => 7.2,
                'dissolved_oxygen' => 6.5,
                'salinity' => 30.2,
                'turbidity' => 12.4
            ]
        ];

        $this->mock(InfluxDBService::class, function (MockInterface $mock) use ($mockTelemetry) {
            $mock->shouldReceive('queryParsed')
                ->once()
                ->andReturn($mockTelemetry);
        });

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/telemetry/csv');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('NODE-TEST-999', $response->streamedContent());
    }

    public function test_maintenance_pdf_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/reports/maintenance/pdf'); // Wait, wait! The route is reports/maintenance/pdf (without double reports)
        // Let's call the actual route
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/maintenance/pdf');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_maintenance_csv_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/maintenance/csv');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Pembersihan sensor suhu', $response->streamedContent());
    }

    public function test_feeding_pdf_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/feeding/pdf');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_feeding_csv_export(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get('/api/v2/reports/feeding/csv');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Pelet Lobster A', $response->streamedContent());
    }
}
