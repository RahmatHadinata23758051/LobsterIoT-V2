<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use App\Models\IotNode;
use App\Models\SensorType;
use App\Models\Threshold;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ThresholdApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected IotNode $node;

    protected function setUp(): void
    {
        parent::setUp();

        // Create standard test data
        $this->user = User::create([
            'name' => 'Owner Name',
            'email' => 'owner@lobsense.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->token = $this->user->createToken('test')->plainTextToken;

        $province = Province::create([
            'code' => '32',
            'name' => 'JAWA BARAT',
        ]);

        $city = City::create([
            'province_id' => $province->id,
            'code' => '3209',
            'name' => 'CIREBON',
        ]);

        $this->node = IotNode::create([
            'city_id' => $city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-99081',
        ]);

        SensorType::create([
            'sensor_code' => 'ph',
            'value_range' => '6.5 - 8.5',
            'description' => 'pH air',
        ]);

        SensorType::create([
            'sensor_code' => 'water_temperature',
            'value_range' => '24 - 30 C',
            'description' => 'Suhu air',
        ]);
    }

    /**
     * Test retrieving thresholds successfully.
     */
    public function test_get_thresholds_success(): void
    {
        Threshold::create([
            'iot_node_serial_number' => 'NODE-99081',
            'sensor_code' => 'ph',
            'value_min' => 6.50,
            'value_max' => 8.50,
            'offset_value' => 0.00,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/thresholds?iot_node_serial_number=NODE-99081');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Thresholds retrieved',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'iot_node_serial_number' => 'NODE-99081',
                'sensor_code' => 'ph',
                'value_min' => 6.5,
                'value_max' => 8.5,
            ]);
    }

    /**
     * Test retrieving thresholds with missing parameters.
     */
    public function test_get_thresholds_validation_error(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/thresholds'); // Missing parameter

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }

    /**
     * Test bulk updating thresholds successfully.
     */
    public function test_bulk_update_thresholds_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/thresholds/bulk-update', [
            'iot_node_serial_number' => 'NODE-99081',
            'thresholds' => [
                [
                    'sensor_code' => 'ph',
                    'value_min' => 6.50,
                    'value_max' => 8.50,
                    'offset_value' => 0.10,
                    'filter_rules' => 'clamp_extreme'
                ],
                [
                    'sensor_code' => 'water_temperature',
                    'value_min' => 24.00,
                    'value_max' => 30.00,
                    'offset_value' => -0.50,
                    'filter_rules' => null
                ]
            ]
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Thresholds updated successfully',
            ]);

        $this->assertDatabaseHas('thresholds', [
            'iot_node_serial_number' => 'NODE-99081',
            'sensor_code' => 'ph',
            'value_min' => '6.50',
            'value_max' => '8.50',
            'offset_value' => '0.10',
            'filter_rules' => 'clamp_extreme',
        ]);

        $this->assertDatabaseHas('thresholds', [
            'iot_node_serial_number' => 'NODE-99081',
            'sensor_code' => 'water_temperature',
            'value_min' => '24.00',
            'value_max' => '30.00',
            'offset_value' => '-0.50',
            'filter_rules' => null,
        ]);
    }
}
