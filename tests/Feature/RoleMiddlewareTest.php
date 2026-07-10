<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test operator cannot update system settings (RBAC block).
     */
    public function test_operator_cannot_update_settings(): void
    {
        $operator = User::create([
            'name' => 'Operator Lobster',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('Lobsense123!'),
            'role' => 'operator',
        ]);

        $token = $operator->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/v2/system-settings', [
            'system_latitude' => '-6.9744',
            'system_longitude' => '107.6303',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk aksi ini.',
            ]);
    }

    /**
     * Test management can update system settings.
     */
    public function test_management_can_update_settings(): void
    {
        $manager = User::create([
            'name' => 'Manager Lobster',
            'email' => 'manager@lobsense.com',
            'password' => bcrypt('Lobsense123!'),
            'role' => 'management',
        ]);

        $token = $manager->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/v2/system-settings', [
            'system_latitude' => '-6.9744',
            'system_longitude' => '107.6303',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /**
     * Test admin can update system settings.
     */
    public function test_admin_can_update_settings(): void
    {
        $admin = User::create([
            'name' => 'Admin Lobster',
            'email' => 'admin@lobsense.com',
            'password' => bcrypt('Lobsense123!'),
            'role' => 'admin',
        ]);

        $token = $admin->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/v2/system-settings', [
            'system_latitude' => '-6.9744',
            'system_longitude' => '107.6303',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);
    }
}
