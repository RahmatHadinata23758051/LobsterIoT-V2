<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AiProxyController extends Controller
{
    /**
     * Proxy Base64 frame to YOLOv8 inference server.
     */
    public function detect(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validasi gagal.', $validator->errors(), 422);
        }

        $base64Data = $request->image;

        // Strip Base64 prefix if exists (e.g. data:image/png;base64,)
        $cleanBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $base64Data);

        // Decode base64 to binary
        $binary = base64_decode($cleanBase64, true);
        if ($binary === false) {
            return $this->error('Format gambar Base64 tidak valid.', null, 422);
        }

        $yoloUrl = env('YOLO_INFERENCE_URL') ?: config('services.yolo.url') ?: 'http://127.0.0.1:8001/predict';

        try {
            // Forward biner data in-memory directly to FastAPI YOLOv8 server
            $response = Http::withoutVerifying()
                ->timeout(5)
                ->attach('image', $binary, 'frame.png')
                ->post($yoloUrl);

            if (!$response->successful()) {
                Log::error("YOLO inference server at {$yoloUrl} returned status {$response->status()}");
                return $this->error("Gagal menghubungi server inferensi AI di {$yoloUrl} (Status: {$response->status()}).", null, 502);
            }

            $json = $response->json();
            $predictions = $json['predictions'] ?? [];

            $total = count($predictions);
            $classes = collect($predictions)->groupBy('class')->map->count()->toArray();

            if ($total > 0) {
                $classPercentage = collect($classes)->map(function ($count) use ($total) {
                    return round(($count / $total) * 100, 2);
                })->toArray();

                try {
                    \App\Models\LogPrediction::create([
                        'raw_prediction' => $predictions,
                        'class_percentage' => $classPercentage,
                    ]);
                } catch (\Exception $dbEx) {
                    Log::warning('Database log prediction failed (ignoring for offline execution): ' . $dbEx->getMessage());
                }
            }

            return $this->success('Detection completed successfully', [
                'total' => $total,
                'classes' => $classes,
                'raw_predictions' => $predictions
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException | \GuzzleHttp\Exception\ConnectException $connEx) {
            Log::warning("AI Inference Server at {$yoloUrl} is offline: " . $connEx->getMessage());
            return response()->json([
                'status' => 'offline',
                'message' => 'Server inferensi AI (Port 8001) sedang tidak terhubung.',
                'data' => [
                    'total' => 0,
                    'classes' => [],
                    'raw_predictions' => []
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('AI Proxy Inference Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'offline',
                'message' => 'Server AI sedang tidak aktif.',
                'data' => [
                    'total' => 0,
                    'classes' => [],
                    'raw_predictions' => []
                ]
            ], 200);
        }
    }

    /**
     * Standard success JSON response envelope.
     */
    protected function success(string $message, $data = null, int $status = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $status);
    }

    /**
     * Standard error JSON response envelope.
     */
    protected function error(string $message, $data = null, int $status = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => $data
        ], $status);
    }
}
