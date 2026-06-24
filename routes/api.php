<?php

use App\Http\Controllers\Api\v2\AuthController;
use App\Http\Controllers\Api\v2\ThresholdController;
use App\Http\Controllers\Api\v2\DeviceOperationController;

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
    });
});

