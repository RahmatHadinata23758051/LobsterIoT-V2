<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use App\Models\IotNode;
use App\Models\EdgeGateway;
use App\Models\Maintenance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DeviceOperationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected City $city;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

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
    }

    /**
     * Test route authentication requirement.
     */
    public function test_device_operations_require_auth(): void
    {
        $this->postJson('/api/v2/devices/validate-serial')->assertStatus(401);
        $this->postJson('/api/v2/devices/activate')->assertStatus(401);
        $this->postJson('/api/v2/maintenances')->assertStatus(401);
    }

    /**
     * Test serial validation success for IoT Node.
     */
    public function test_validate_serial_iot_node_success(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-11111',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/validate-serial', [
            'category' => 'iot_node',
            'serial_number' => 'NODE-11111',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Serial number is valid.',
                'data' => [
                    'id' => $node->id,
                    'category' => 'iot_node',
                    'serial_number' => 'NODE-11111',
                    'is_activated' => false,
                ]
            ]);
    }

    /**
     * Test serial validation success for Edge Gateway.
     */
    public function test_validate_serial_edge_gateway_success(): void
    {
        $gateway = EdgeGateway::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'GATEWAY-22222',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/validate-serial', [
            'category' => 'edge_gateway',
            'serial_number' => 'GATEWAY-22222',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Serial number is valid.',
                'data' => [
                    'id' => $gateway->id,
                    'category' => 'edge_gateway',
                    'serial_number' => 'GATEWAY-22222',
                    'is_activated' => false,
                ]
            ]);
    }

    /**
     * Test serial validation fails validation.
     */
    public function test_validate_serial_validation_errors(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/validate-serial', [
            'category' => 'invalid_category',
            // missing serial_number
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }

    /**
     * Test serial validation not found.
     */
    public function test_validate_serial_not_found(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/validate-serial', [
            'category' => 'iot_node',
            'serial_number' => 'NODE-UNKNOWN',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Nomor seri tidak ditemukan.',
            ]);
    }

    /**
     * Test maintenance validation check when device is not activated.
     */
    public function test_validate_serial_maintenance_unactivated_fails(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-11111',
            'activated_at' => null, // not activated
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/validate-serial', [
            'category' => 'iot_node',
            'serial_number' => 'NODE-11111',
            'is_maintenance' => true,
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'status' => 'error',
                'message' => 'Alat belum diaktivasi. Tidak dapat mengajukan pemeliharaan.',
            ]);
    }

    /**
     * Test successful activation of an IoT node.
     */
    public function test_activate_iot_node_success(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-11111',
        ]);

        $picture = UploadedFile::fake()->image('node.jpg');
        $signature = UploadedFile::fake()->image('sig.png');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/activate', [
            'category' => 'iot_node',
            'id' => $node->id,
            'picture' => $picture,
            'signature' => $signature,
            'latitude' => -6.12345,
            'longitude' => 106.12345,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Device activated successfully',
            ]);

        $node->refresh();
        $this->assertNotNull($node->activated_at);
        $this->assertEquals($this->user->id, $node->activated_by);
        $this->assertEquals(-6.12345, (float)$node->latitude);
        $this->assertEquals(106.12345, (float)$node->longitude);

        Storage::disk('public')->assertExists($node->device_photo);
        Storage::disk('public')->assertExists($node->handover_signature);
    }

    /**
     * Test successful activation of an Edge Gateway.
     */
    public function test_activate_edge_gateway_success(): void
    {
        $gateway = EdgeGateway::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'GATEWAY-22222',
        ]);

        $picture = UploadedFile::fake()->image('gateway.jpg');
        $signature = UploadedFile::fake()->image('sig.png');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/devices/activate', [
            'category' => 'edge_gateway',
            'id' => $gateway->id,
            'picture' => $picture,
            'signature' => $signature,
            'latitude' => -6.12345,
            'longitude' => 106.12345,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Device activated successfully',
            ]);

        $gateway->refresh();
        $this->assertNotNull($gateway->activated_at);
        $this->assertEquals($this->user->id, $gateway->activated_by);
        $this->assertEquals(-6.12345, (float)$gateway->latitude);
        $this->assertEquals(106.12345, (float)$gateway->longitude);

        Storage::disk('public')->assertExists($gateway->device_photo);
        Storage::disk('public')->assertExists($gateway->handover_signature);
    }

    /**
     * Test successful maintenance log registration.
     */
    public function test_submit_maintenance_success(): void
    {
        $node = IotNode::create([
            'city_id' => $this->city->id,
            'owner_id' => $this->user->id,
            'serial_number' => 'NODE-11111',
            'activated_at' => now(),
            'activated_by' => $this->user->id,
        ]);

        $picture = UploadedFile::fake()->image('maint.jpg');
        $signature = UploadedFile::fake()->image('sig.png');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/maintenances', [
            'iot_node_id' => $node->id,
            'description' => 'Sensor pH replacement and calibration.',
            'picture' => $picture,
            'signature' => $signature,
            'latitude' => -6.54321,
            'longitude' => 106.54321,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Maintenance log registered successfully',
            ]);

        $maintenance = Maintenance::first();
        $this->assertNotNull($maintenance);
        $this->assertEquals($node->id, $maintenance->iot_node_id);
        $this->assertEquals($this->user->id, $maintenance->operator_id);
        $this->assertEquals('Sensor pH replacement and calibration.', $maintenance->description);
        $this->assertEquals(-6.54321, (float)$maintenance->latitude);
        $this->assertEquals(106.54321, (float)$maintenance->longitude);

        Storage::disk('public')->assertExists($maintenance->device_photo);
        Storage::disk('public')->assertExists($maintenance->operator_signature);
    }
}
