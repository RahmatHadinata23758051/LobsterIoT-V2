<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Operator;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OperatorApiTest extends TestCase
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
     * Test operators routes require authentication.
     */
    public function test_operators_routes_require_auth(): void
    {
        $this->getJson('/api/v2/operators')->assertStatus(401);
        $this->postJson('/api/v2/operators')->assertStatus(401);
        $this->getJson('/api/v2/operators/1')->assertStatus(401);
        $this->putJson('/api/v2/operators/1')->assertStatus(401);
        $this->deleteJson('/api/v2/operators/1')->assertStatus(401);
    }

    /**
     * Test index retrieves all operators successfully.
     */
    public function test_index_operators_success(): void
    {
        Operator::create([
            'full_name' => 'Operator Satu',
            'phone_number' => '081234567890',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        Operator::create([
            'full_name' => 'Operator Dua',
            'phone_number' => '082345678901',
            'address' => 'Jl. Keadilan No. 22',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/operators');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Operators retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['full_name' => 'Operator Satu'])
            ->assertJsonFragment(['full_name' => 'Operator Dua']);
    }

    /**
     * Test store creates a new operator successfully.
     */
    public function test_store_operator_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/operators', [
            'full_name' => 'Operator Baru',
            'phone_number' => '083456789012',
            'address' => 'Jl. Baru No. 99',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Operator created successfully',
            ])
            ->assertJsonFragment(['full_name' => 'Operator Baru']);

        $this->assertDatabaseHas('operators', [
            'full_name' => 'Operator Baru',
            'phone_number' => '083456789012',
        ]);
    }

    /**
     * Test store fails validation.
     */
    public function test_store_operator_validation_error(): void
    {
        // Missing full_name
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/operators', [
            'phone_number' => '083456789012',
            'address' => 'Jl. Baru No. 99',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }

    /**
     * Test show retrieves single operator details.
     */
    public function test_show_operator_success(): void
    {
        $operator = Operator::create([
            'full_name' => 'Operator Satu',
            'phone_number' => '081234567890',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/operators/' . $operator->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Operator retrieved successfully',
                'data' => [
                    'id' => $operator->id,
                    'full_name' => 'Operator Satu',
                ]
            ]);
    }

    /**
     * Test show returns 404 when operator is not found.
     */
    public function test_show_operator_not_found(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/operators/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Operator tidak ditemukan.',
            ]);
    }

    /**
     * Test update modifies operator successfully.
     */
    public function test_update_operator_success(): void
    {
        $operator = Operator::create([
            'full_name' => 'Operator Asli',
            'phone_number' => '081234567890',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson('/api/v2/operators/' . $operator->id, [
            'full_name' => 'Operator Ubahan',
            'phone_number' => '089999999999',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Operator updated successfully',
                'data' => [
                    'full_name' => 'Operator Ubahan',
                    'phone_number' => '089999999999',
                ]
            ]);

        $this->assertDatabaseHas('operators', [
            'id' => $operator->id,
            'full_name' => 'Operator Ubahan',
            'phone_number' => '089999999999',
        ]);
    }

    /**
     * Test delete removes operator successfully.
     */
    public function test_delete_operator_success(): void
    {
        $operator = Operator::create([
            'full_name' => 'Operator Dihapus',
            'phone_number' => '081234567890',
            'address' => 'Jl. Merdeka No. 10',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson('/api/v2/operators/' . $operator->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Operator deleted successfully',
            ]);

        $this->assertDatabaseMissing('operators', [
            'id' => $operator->id,
        ]);
    }
}
