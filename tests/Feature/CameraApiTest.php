<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cage;
use App\Models\IotNode;
use App\Models\Province;
use App\Models\City;
use App\Models\Camera;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CameraApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected Cage $cage;
    protected IotNode $iotNode;

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
            'code' => '50',
            'name' => 'Lombok'
        ]);

        $city = City::create([
            'province_id' => $province->id,
            'code' => '5001',
            'name' => 'Lombok Barat'
        ]);


        $this->cage = Cage::create([
            'cage_code' => 'CAGE-01',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $this->iotNode = IotNode::create([
            'serial_number' => 'CAM-NODE-01',
            'city_id' => $city->id,
            'owner_id' => $this->user->id,
            'cage_id' => $this->cage->id,
            'activated_at' => now(),
        ]);
    }

    /**
     * Test cameras routes require authentication.
     */
    public function test_cameras_routes_require_auth(): void
    {
        $this->getJson('/api/v2/cameras')->assertStatus(401);
        $this->postJson('/api/v2/cameras')->assertStatus(401);
        $this->getJson('/api/v2/cameras/1')->assertStatus(401);
        $this->putJson('/api/v2/cameras/1')->assertStatus(401);
        $this->deleteJson('/api/v2/cameras/1')->assertStatus(401);
    }

    /**
     * Test index retrieves all cameras successfully.
     */
    public function test_index_cameras_success(): void
    {
        Camera::create([
            'camera_code' => 'CAM-01',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/cam1',
            'is_active' => true,
        ]);

        Camera::create([
            'camera_code' => 'CAM-02',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/cam2',
            'is_active' => false,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cameras');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cameras retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['camera_code' => 'CAM-01'])
            ->assertJsonFragment(['camera_code' => 'CAM-02']);
    }

    /**
     * Test store creates a new camera successfully.
     */
    public function test_store_camera_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/cameras', [
            'camera_code' => 'CAM-NEW',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/camnew',
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Camera created successfully',
            ])
            ->assertJsonFragment(['camera_code' => 'CAM-NEW']);

        $this->assertDatabaseHas('cameras', [
            'camera_code' => 'CAM-NEW',
            'iot_node_id' => $this->iotNode->id,
            'is_active' => true,
        ]);
    }

    /**
     * Test store fails validation.
     */
    public function test_store_camera_validation_error(): void
    {
        // First camera
        Camera::create([
            'camera_code' => 'CAM-DUP',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/camdup',
            'is_active' => true,
        ]);

        // Duplicate code and non-existent iot_node_id
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/cameras', [
            'camera_code' => 'CAM-DUP',
            'iot_node_id' => 999, // non-existent
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }

    /**
     * Test show retrieves single camera details.
     */
    public function test_show_camera_success(): void
    {
        $camera = Camera::create([
            'camera_code' => 'CAM-01',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/cam1',
            'is_active' => true,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cameras/' . $camera->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Camera retrieved successfully',
                'data' => [
                    'id' => $camera->id,
                    'camera_code' => 'CAM-01',
                ]
            ]);
    }

    /**
     * Test show returns 404 when camera is not found.
     */
    public function test_show_camera_not_found(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cameras/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Camera tidak ditemukan.',
            ]);
    }

    /**
     * Test update modifies camera successfully.
     */
    public function test_update_camera_success(): void
    {
        $camera = Camera::create([
            'camera_code' => 'CAM-OLD',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/camold',
            'is_active' => false,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson('/api/v2/cameras/' . $camera->id, [
            'camera_code' => 'CAM-UPDATED',
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Camera updated successfully',
                'data' => [
                    'camera_code' => 'CAM-UPDATED',
                    'is_active' => true,
                ]
            ]);

        $this->assertDatabaseHas('cameras', [
            'id' => $camera->id,
            'camera_code' => 'CAM-UPDATED',
            'is_active' => true,
        ]);
    }

    /**
     * Test delete removes camera successfully.
     */
    public function test_delete_camera_success(): void
    {
        $camera = Camera::create([
            'camera_code' => 'CAM-TO-DELETE',
            'iot_node_id' => $this->iotNode->id,
            'stream_url' => 'rtsp://127.0.0.1:8554/camdel',
            'is_active' => true,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/v2/cameras/' . $camera->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Camera deleted successfully',
            ]);

        $this->assertDatabaseMissing('cameras', [
            'id' => $camera->id,
        ]);
    }
}
