<?php

use App\Http\Controllers\Api\v2\AuthController;
use App\Http\Controllers\Api\v2\ThresholdController;
use App\Http\Controllers\Api\v2\DeviceOperationController;
use App\Http\Controllers\Api\v2\CageController;
use App\Http\Controllers\Api\v2\CameraController;
use App\Http\Controllers\Api\v2\OperatorController;
use App\Http\Controllers\Api\v2\RegionController;
use App\Http\Controllers\Api\v2\SensorTypeController;
use App\Http\Controllers\Api\v2\FeedingLogController;
use App\Http\Controllers\Api\v2\WeatherController;
use App\Http\Controllers\Api\v2\AiProxyController;
use App\Http\Controllers\Api\v2\MonitoringController;
use App\Http\Controllers\Api\v2\EdgeGatewayController;
use App\Http\Controllers\Api\v2\IotNodeController;
use App\Http\Controllers\Api\v2\SystemSettingController;

Route::prefix('v2')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('profile', [AuthController::class, 'profile']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Threshold configurations
        Route::get('thresholds', [ThresholdController::class, 'index']);
        Route::post('thresholds/bulk-update', [ThresholdController::class, 'bulkUpdate']);

        // Device Operations
        Route::post('devices/validate-serial', [DeviceOperationController::class, 'validateSerial']);
        Route::post('devices/activate', [DeviceOperationController::class, 'activate']);
        Route::post('maintenances', [DeviceOperationController::class, 'submitMaintenance']);
        Route::get('maintenances', [DeviceOperationController::class, 'indexMaintenance']);

        // Cages (KJA)
        Route::apiResource('cages', CageController::class);

        // Cameras
        Route::apiResource('cameras', CameraController::class);

        // Operators
        Route::apiResource('operators', OperatorController::class);

        // Edge Gateways
        Route::apiResource('edge-gateways', EdgeGatewayController::class);

        // IoT Nodes Master
        Route::apiResource('iot-nodes-master', IotNodeController::class);

        // Regions (Provinces, Cities & Districts)
        Route::get('provinces', [RegionController::class, 'provinces']);
        Route::get('cities', [RegionController::class, 'cities']);
        Route::get('districts', [RegionController::class, 'districts']);

        // Sensor Types
        Route::get('sensor-types', [SensorTypeController::class, 'index']);

        // Feeding Logs
        Route::get('feeding-logs', [FeedingLogController::class, 'index']);
        Route::post('feeding-logs', [FeedingLogController::class, 'store']);
        Route::delete('feeding-logs/{id}', [FeedingLogController::class, 'destroy']);


        // Weather
        Route::get('weather/latest', [WeatherController::class, 'latest']);

        // System Settings
        Route::get('system-settings', [SystemSettingController::class, 'index']);
        Route::put('system-settings', [SystemSettingController::class, 'update']);

        // AI Proxy
        Route::post('detect', [AiProxyController::class, 'detect']);

        // IoT Telemetry Monitoring
        Route::get('iot-nodes', [MonitoringController::class, 'activeNodes']);
        Route::get('monitoring/dashboard/{serial_number}', [MonitoringController::class, 'dashboard']);
        Route::get('monitoring/history/{serial_number}', [MonitoringController::class, 'history']);
    });
});








