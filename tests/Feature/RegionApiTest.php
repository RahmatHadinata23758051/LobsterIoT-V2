<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RegionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected Province $provinceJabar;
    protected Province $provinceJatim;

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

        $this->provinceJabar = Province::create([
            'code' => '32',
            'name' => 'JAWA BARAT',
        ]);

        $this->provinceJatim = Province::create([
            'code' => '35',
            'name' => 'JAWA TIMUR',
        ]);

        City::create([
            'province_id' => $this->provinceJabar->id,
            'code' => '3209',
            'name' => 'CIREBON',
        ]);

        City::create([
            'province_id' => $this->provinceJabar->id,
            'code' => '3201',
            'name' => 'BOGOR',
        ]);

        City::create([
            'province_id' => $this->provinceJatim->id,
            'code' => '3578',
            'name' => 'SURABAYA',
        ]);
    }

    /**
     * Test regions routes require authentication.
     */
    public function test_regions_routes_require_auth(): void
    {
        $this->getJson('/api/v2/provinces')->assertStatus(401);
        $this->getJson('/api/v2/cities')->assertStatus(401);
    }

    /**
     * Test retrieves all provinces successfully.
     */
    public function test_get_provinces_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/provinces');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Provinces retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['name' => 'JAWA BARAT'])
            ->assertJsonFragment(['name' => 'JAWA TIMUR']);
    }

    /**
     * Test retrieves all cities successfully.
     */
    public function test_get_cities_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cities');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cities retrieved successfully',
            ])
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['name' => 'CIREBON'])
            ->assertJsonFragment(['name' => 'BOGOR'])
            ->assertJsonFragment(['name' => 'SURABAYA']);
    }

    /**
     * Test retrieves cities filtered by province_id successfully.
     */
    public function test_get_cities_filtered_by_province(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/cities?province_id=' . $this->provinceJabar->id);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Cities retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['name' => 'CIREBON'])
            ->assertJsonFragment(['name' => 'BOGOR'])
            ->assertJsonMissing(['name' => 'SURABAYA']);
    }
}
