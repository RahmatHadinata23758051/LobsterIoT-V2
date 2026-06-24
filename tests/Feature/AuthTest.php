<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user login with correct credentials.
     */
    public function test_login_success(): void
    {
        $user = User::create([
            'name' => 'Operator Lobster',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
        ]);

        $response = $this->postJson('/api/v2/auth/login', [
            'email' => 'operator@lobsense.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Successfully authenticated!',
            ])
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'profile_picture',
                    ]
                ]
            ]);
    }

    /**
     * Test user login with invalid credentials.
     */
    public function test_login_fail(): void
    {
        User::create([
            'name' => 'Operator Lobster',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
        ]);

        $response = $this->postJson('/api/v2/auth/login', [
            'email' => 'operator@lobsense.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(411)
            ->assertJson([
                'status' => 'error',
                'message' => 'Email atau password yang dimasukan tidak valid.',
                'data' => null
            ]);
    }

    /**
     * Test profile retrieval.
     */
    public function test_get_profile_success(): void
    {
        $user = User::create([
            'name' => 'Operator Lobster',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
            'profile_picture' => 'images/profiles/avatar.png'
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v2/profile');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Profile retrieved',
                'data' => [
                    'id' => $user->id,
                    'name' => 'Operator Lobster',
                    'email' => 'operator@lobsense.com',
                    'role' => 'operator',
                    'profile_picture' => 'images/profiles/avatar.png',
                ]
            ]);
    }

    /**
     * Test profile retrieval without authentication.
     */
    public function test_get_profile_unauthorized(): void
    {
        $response = $this->getJson('/api/v2/profile');

        $response->assertStatus(401);
    }

    /**
     * Test profile update.
     */
    public function test_update_profile_success(): void
    {
        $user = User::create([
            'name' => 'Old Name',
            'email' => 'old@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/v2/profile', [
            'name' => 'New Name',
            'email' => 'new@lobsense.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'name' => 'New Name',
                    'email' => 'new@lobsense.com',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@lobsense.com',
        ]);
    }

    /**
     * Test user logout.
     */
    public function test_logout_success(): void
    {
        $user = User::create([
            'name' => 'Operator Lobster',
            'email' => 'operator@lobsense.com',
            'password' => bcrypt('password123'),
            'role' => 'operator',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v2/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Successfully logged out!',
            ]);

        $this->assertCount(0, $user->tokens);
    }
}
