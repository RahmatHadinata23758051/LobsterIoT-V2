<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CageApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

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
    }

    /**
     * Test cages routes require authentication.
     */
    public function test_cages_routes_require_auth(): void
    {
        $this->getJson('/api/v2/cages')->assertStatus(401);
        $this->postJson('/api/v2/cages')->assertStatus(401);
        $this->getJson('/api/v2/cages/1')->assertStatus(401);
        $this->putJson('/api/v2/cages/1')->assertStatus(401);
        $this->deleteJson('/api/v2/cages/1')->assertStatus(401);
    }

    /**
     * Test index retrieves all cages successfully.
     */
    public function test_index_cages_success(): void
    {
        Cage::create([
            'cage_code' => 'CAGE-01',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        Cage::create([
            'cage_code' => 'CAGE-02',
            'latitude' => -6.456,
            'longitude' => 106.456,
            'volume_cubic_meters' => 75.0,
            'structure_condition' => 'Needs Maintenance',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cages');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cages retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['cage_code' => 'CAGE-01'])
            ->assertJsonFragment(['cage_code' => 'CAGE-02']);
    }

    /**
     * Test store creates a new cage successfully.
     */
    public function test_store_cage_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/cages', [
            'cage_code' => 'CAGE-NEW',
            'latitude' => -6.789,
            'longitude' => 106.789,
            'volume_cubic_meters' => 100.0,
            'structure_condition' => 'Brand New',
            'lobster_count' => 150,
            'lobster_age_days' => 45,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cage created successfully',
            ])
            ->assertJsonFragment(['cage_code' => 'CAGE-NEW']);

        $this->assertDatabaseHas('cages', [
            'cage_code' => 'CAGE-NEW',
            'lobster_count' => 150,
            'lobster_age_days' => 45,
        ]);
    }

    /**
     * Test store fails validation.
     */
    public function test_store_cage_validation_error(): void
    {
        // First cage
        Cage::create([
            'cage_code' => 'CAGE-DUPLICATE',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        // Post duplicate cage_code
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/cages', [
            'cage_code' => 'CAGE-DUPLICATE',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }

    /**
     * Test show retrieves single cage details.
     */
    public function test_show_cage_success(): void
    {
        $cage = Cage::create([
            'cage_code' => 'CAGE-01',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cages/' . $cage->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cage retrieved successfully',
                'data' => [
                    'id' => $cage->id,
                    'cage_code' => 'CAGE-01',
                ]
            ]);
    }

    /**
     * Test show returns 404 when cage is not found.
     */
    public function test_show_cage_not_found(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cages/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Cage tidak ditemukan.',
            ]);
    }

    /**
     * Test update modifies cage successfully.
     */
    public function test_update_cage_success(): void
    {
        $cage = Cage::create([
            'cage_code' => 'CAGE-OLD',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson('/api/v2/cages/' . $cage->id, [
            'cage_code' => 'CAGE-UPDATED',
            'structure_condition' => 'Fair',
            'lobster_age_days' => 60,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cage updated successfully',
                'data' => [
                    'cage_code' => 'CAGE-UPDATED',
                    'structure_condition' => 'Fair',
                    'lobster_age_days' => 60,
                ]
            ]);

        $this->assertDatabaseHas('cages', [
            'id' => $cage->id,
            'cage_code' => 'CAGE-UPDATED',
            'structure_condition' => 'Fair',
        ]);
    }

    /**
     * Test delete removes cage successfully.
     */
    public function test_delete_cage_success(): void
    {
        $cage = Cage::create([
            'cage_code' => 'CAGE-TO-DELETE',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/v2/cages/' . $cage->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cage deleted successfully',
            ]);

        $this->assertDatabaseMissing('cages', [
            'id' => $cage->id,
        ]);
    }
}
