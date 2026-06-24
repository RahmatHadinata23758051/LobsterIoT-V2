<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SensorType;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SensorTypeApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

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

        SensorType::create([
            'sensor_code' => 'ph',
            'value_range' => '6.5 - 8.5',
            'description' => 'pH air',
        ]);

        SensorType::create([
            'sensor_code' => 'tds',
            'value_range' => '150 - 400 ppm',
            'description' => 'TDS air',
        ]);
    }

    /**
     * Test sensor types route requires authentication.
     */
    public function test_sensor_types_route_requires_auth(): void
    {
        $this->getJson('/api/v2/sensor-types')->assertStatus(401);
    }

    /**
     * Test retrieves all sensor types successfully.
     */
    public function test_get_sensor_types_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/sensor-types');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Sensor types retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['sensor_code' => 'ph'])
            ->assertJsonFragment(['sensor_code' => 'tds']);
    }
}
