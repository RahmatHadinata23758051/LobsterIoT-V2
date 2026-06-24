<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cage;
use App\Models\Operator;
use App\Models\FeedingLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class FeedingLogApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected Cage $cage1;
    protected Cage $cage2;
    protected Operator $operator1;
    protected Operator $operator2;

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

        $this->cage1 = Cage::create([
            'cage_code' => 'CAGE-01',
            'latitude' => -6.123,
            'longitude' => 106.123,
            'volume_cubic_meters' => 50.5,
            'structure_condition' => 'Excellent',
        ]);

        $this->cage2 = Cage::create([
            'cage_code' => 'CAGE-02',
            'latitude' => -6.456,
            'longitude' => 106.456,
            'volume_cubic_meters' => 75.0,
            'structure_condition' => 'Good',
        ]);

        $this->operator1 = Operator::create([
            'full_name' => 'Operator A',
            'phone_number' => '0812345678',
            'address' => 'Alamat A',
        ]);

        $this->operator2 = Operator::create([
            'full_name' => 'Operator B',
            'phone_number' => '0876543210',
            'address' => 'Alamat B',
        ]);
    }

    /**
     * Test feeding logs routes require authentication.
     */
    public function test_feeding_logs_routes_require_auth(): void
    {
        $this->getJson('/api/v2/feeding-logs')->assertStatus(401);
        $this->postJson('/api/v2/feeding-logs')->assertStatus(401);
    }

    /**
     * Test index retrieves all feeding logs.
     */
    public function test_index_feeding_logs_success(): void
    {
        FeedingLog::create([
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pellet A',
            'weight_kg' => 2.5,
        ]);

        FeedingLog::create([
            'cage_id' => $this->cage2->id,
            'operator_id' => $this->operator2->id,
            'feed_session' => 'afternoon',
            'feed_type' => 'Pellet B',
            'weight_kg' => 3.0,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/feeding-logs');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Feeding logs retrieved successfully',
            ])
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['feed_type' => 'Pellet A'])
            ->assertJsonFragment(['feed_type' => 'Pellet B']);
    }

    /**
     * Test index retrieves feeding logs filtered by cage_id.
     */
    public function test_index_feeding_logs_filtered_by_cage(): void
    {
        FeedingLog::create([
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pellet A',
            'weight_kg' => 2.5,
        ]);

        FeedingLog::create([
            'cage_id' => $this->cage2->id,
            'operator_id' => $this->operator2->id,
            'feed_session' => 'afternoon',
            'feed_type' => 'Pellet B',
            'weight_kg' => 3.0,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/feeding-logs?cage_id=' . $this->cage1->id);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['feed_type' => 'Pellet A'])
            ->assertJsonMissing(['feed_type' => 'Pellet B']);
    }

    /**
     * Test index retrieves feeding logs filtered by operator_id.
     */
    public function test_index_feeding_logs_filtered_by_operator(): void
    {
        FeedingLog::create([
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pellet A',
            'weight_kg' => 2.5,
        ]);

        FeedingLog::create([
            'cage_id' => $this->cage2->id,
            'operator_id' => $this->operator2->id,
            'feed_session' => 'afternoon',
            'feed_type' => 'Pellet B',
            'weight_kg' => 3.0,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/feeding-logs?operator_id=' . $this->operator2->id);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['feed_type' => 'Pellet B'])
            ->assertJsonMissing(['feed_type' => 'Pellet A']);
    }

    /**
     * Test index retrieves feeding logs filtered by date.
     */
    public function test_index_feeding_logs_filtered_by_date(): void
    {
        $logToday = FeedingLog::create([
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'morning',
            'feed_type' => 'Pellet Today',
            'weight_kg' => 1.5,
        ]);

        $logYesterday = new FeedingLog([
            'cage_id' => $this->cage2->id,
            'operator_id' => $this->operator2->id,
            'feed_session' => 'night',
            'feed_type' => 'Pellet Yesterday',
            'weight_kg' => 4.0,
        ]);
        $logYesterday->created_at = Carbon::yesterday();
        $logYesterday->save();

        // Query today's logs
        $responseToday = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/feeding-logs?date=' . Carbon::today()->toDateString());

        $responseToday->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['feed_type' => 'Pellet Today'])
            ->assertJsonMissing(['feed_type' => 'Pellet Yesterday']);

        // Query yesterday's logs
        $responseYesterday = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v2/feeding-logs?date=' . Carbon::yesterday()->toDateString());

        $responseYesterday->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['feed_type' => 'Pellet Yesterday'])
            ->assertJsonMissing(['feed_type' => 'Pellet Today']);
    }

    /**
     * Test storing a feeding log successfully.
     */
    public function test_store_feeding_log_success(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/feeding-logs', [
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'night',
            'feed_type' => 'Premium BioFeed',
            'weight_kg' => 5.25,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Feeding log registered successfully',
                'data' => [
                    'feed_session' => 'night',
                    'feed_type' => 'Premium BioFeed',
                    'weight_kg' => 5.25,
                ]
            ]);

        $this->assertDatabaseHas('feeding_logs', [
            'cage_id' => $this->cage1->id,
            'operator_id' => $this->operator1->id,
            'feed_session' => 'night',
            'feed_type' => 'Premium BioFeed',
            'weight_kg' => 5.25,
        ]);
    }

    /**
     * Test storing feeding log fails validation.
     */
    public function test_store_feeding_log_validation_error(): void
    {
        // Invalid session name, negative weight, non-existent references
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/feeding-logs', [
            'cage_id' => 999, // non-existent
            'operator_id' => $this->operator1->id,
            'feed_session' => 'invalid_session',
            'feed_type' => 'Standard Pellet',
            'weight_kg' => -1.5,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ]);
    }
}
