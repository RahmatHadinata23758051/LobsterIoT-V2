<?php

use App\Http\Controllers\Api\v2\AuthController;
use App\Http\Controllers\Api\v2\ThresholdController;

Route::prefix('v2')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('profile', [AuthController::class, 'profile']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Threshold configurations
        Route::get('thresholds', [ThresholdController::class, 'index']);
        Route::post('thresholds/bulk-update', [ThresholdController::class, 'bulkUpdate']);
    });
});
