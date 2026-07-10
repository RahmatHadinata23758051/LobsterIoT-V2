<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class AiProxyApiTest extends TestCase
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

        // Configure YOLO URL for testing
        config(['services.yolo.url' => 'http://yolo-test-server/predict']);
    }

    /**
     * Test route requires authentication.
     */
    public function test_detect_route_requires_auth(): void
    {
        $this->postJson('/api/v2/detect', ['image' => 'somebase64'])
            ->assertStatus(401);
    }

    /**
     * Test validation fails when image is missing.
     */
    public function test_detect_validation_fails_missing_image(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/detect', []);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Validasi gagal.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'image'
                ]
            ]);
    }

    /**
     * Test validation fails when image format is not valid base64.
     */
    public function test_detect_validation_fails_invalid_base64(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/detect', [
            'image' => '!!!invalid_base64!!!'
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Format gambar Base64 tidak valid.',
            ]);
    }

    /**
     * Test successful proxy to YOLO inference server.
     */
    public function test_detect_success(): void
    {
        // Simple valid base64 encoded transparent 1x1 gif
        $validBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        Http::fake([
            'yolo-test-server/predict' => Http::response([
                'predictions' => [
                    ['class' => 'lobster_alive', 'confidence' => 0.85, 'x' => 100, 'y' => 150, 'width' => 50, 'height' => 50],
                    ['class' => 'lobster_alive', 'confidence' => 0.90, 'x' => 200, 'y' => 250, 'width' => 60, 'height' => 60],
                    ['class' => 'lobster_dead', 'confidence' => 0.75, 'x' => 300, 'y' => 350, 'width' => 70, 'height' => 70]
                ]
            ], 200)
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/detect', [
            'image' => $validBase64
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Detection completed successfully',
                'data' => [
                    'total' => 3,
                    'classes' => [
                        'lobster_alive' => 2,
                        'lobster_dead' => 1
                    ],
                    'raw_predictions' => [
                        ['class' => 'lobster_alive', 'confidence' => 0.85, 'x' => 100, 'y' => 150, 'width' => 50, 'height' => 50],
                        ['class' => 'lobster_alive', 'confidence' => 0.90, 'x' => 200, 'y' => 250, 'width' => 60, 'height' => 60],
                        ['class' => 'lobster_dead', 'confidence' => 0.75, 'x' => 300, 'y' => 350, 'width' => 70, 'height' => 70]
                    ]
                ]
            ]);

        // Verify database log prediction record
        $this->assertDatabaseCount('log_predictions', 1);
        $log = \App\Models\LogPrediction::first();
        $this->assertNotNull($log);
        $this->assertEquals(66.67, $log->class_percentage['lobster_alive']);
        $this->assertEquals(33.33, $log->class_percentage['lobster_dead']);

        // Verify that Http request was correctly formatted with in-memory attachment
        Http::assertSent(function ($request) {
            return $request->url() === 'http://yolo-test-server/predict' &&
                $request->isMultipart() &&
                $request->toPsrRequest()->getUri()->getPath() === '/predict';
        });
    }

    /**
     * Test handling when YOLO server returns error response (e.g. 500).
     */
    public function test_detect_yolo_server_fails(): void
    {
        $validBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        Http::fake([
            'yolo-test-server/predict' => Http::response('Internal Server Error', 500)
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/detect', [
            'image' => $validBase64
        ]);

        $response->assertStatus(502)
            ->assertJson([
                'status' => 'error',
                'message' => 'Gagal menghubungi server inferensi AI.'
            ]);
    }

    /**
     * Test handling when YOLO server connection throws an exception (e.g. timeout).
     */
    public function test_detect_yolo_server_timeout(): void
    {
        $validBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        Http::fake(function ($request) {
            throw new \Illuminate\Http\Client\ConnectionException("Connection timed out");
        });

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v2/detect', [
            'image' => $validBase64
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memproses deteksi AI.'
            ]);
    }
}
