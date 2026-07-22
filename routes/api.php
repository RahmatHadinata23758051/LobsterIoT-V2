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
use App\Http\Controllers\Api\v2\ReportController;
use App\Http\Controllers\Api\v2\Mobile\MobileDashboardController;
use App\Http\Controllers\Api\v2\Mobile\MobileControlController;

Route::prefix('v2')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('detect', [AiProxyController::class, 'detect']);
        Route::get('profile', [AuthController::class, 'profile']);

        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // ── Dedicated Mobile API Group ──
        Route::prefix('mobile')->group(function () {
            Route::get('summary', [MobileDashboardController::class, 'summary']);
            Route::get('telemetry/{serial_number}', [MobileDashboardController::class, 'nodeTelemetry']);
            Route::get('feeding/schedules', [MobileControlController::class, 'index']);
            Route::post('feeding/schedule', [MobileControlController::class, 'storeSchedule']);
            Route::post('feeding/trigger', [MobileControlController::class, 'triggerInstant']);
        });

        // Threshold configurations (Read-only)
        Route::get('thresholds', [ThresholdController::class, 'index']);

        // Device Operations
        Route::post('devices/validate-serial', [DeviceOperationController::class, 'validateSerial']);
        Route::post('devices/activate', [DeviceOperationController::class, 'activate']);
        Route::post('maintenances', [DeviceOperationController::class, 'submitMaintenance']);
        Route::get('maintenances', [DeviceOperationController::class, 'indexMaintenance']);

        // Cages (KJA) — Read Only
        Route::get('cages', [CageController::class, 'index']);
        Route::get('cages/{cage}', [CageController::class, 'show']);

        // Cameras — Read Only
        Route::get('cameras', [CameraController::class, 'index']);
        Route::get('cameras/{camera}', [CameraController::class, 'show']);

        // Operators — Read Only
        Route::get('operators', [OperatorController::class, 'index']);
        Route::get('operators/{operator}', [OperatorController::class, 'show']);

        // Edge Gateways — Read Only
        Route::get('edge-gateways', [EdgeGatewayController::class, 'index']);
        Route::get('edge-gateways/{edge_gateway}', [EdgeGatewayController::class, 'show']);

        // IoT Nodes Master — Read Only
        Route::get('iot-nodes-master', [IotNodeController::class, 'index']);
        Route::get('iot-nodes-master/{iot_nodes_master}', [IotNodeController::class, 'show']);

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

        // System Settings — Read Only
        Route::get('system-settings', [SystemSettingController::class, 'index']);



        // IoT Telemetry Monitoring
        Route::get('iot-nodes', [MonitoringController::class, 'activeNodes']);
        Route::get('monitoring/dashboard/{serial_number}', [MonitoringController::class, 'dashboard']);
        Route::get('monitoring/history/{serial_number}', [MonitoringController::class, 'history']);

        // Reports & Exports
        Route::get('reports', [ReportController::class, 'index']);
        Route::get('reports/node-registration/pdf', [ReportController::class, 'nodeRegistrationPDF']);
        Route::get('reports/node-registration/csv', [ReportController::class, 'nodeRegistrationCSV']);
        Route::get('reports/node-registration/excel', [ReportController::class, 'nodeRegistrationExcel']);
        Route::get('reports/telemetry/pdf', [ReportController::class, 'telemetryPDF']);
        Route::get('reports/telemetry/csv', [ReportController::class, 'telemetryCSV']);
        Route::get('reports/telemetry/excel', [ReportController::class, 'telemetryExcel']);
        Route::get('reports/maintenance/pdf', [ReportController::class, 'maintenancePDF']);
        Route::get('reports/maintenance/csv', [ReportController::class, 'maintenanceCSV']);
        Route::get('reports/maintenance/excel', [ReportController::class, 'maintenanceExcel']);
        Route::get('reports/feeding/pdf', [ReportController::class, 'feedingPDF']);
        Route::get('reports/feeding/csv', [ReportController::class, 'feedingCSV']);
        Route::get('reports/feeding/excel', [ReportController::class, 'feedingExcel']);

        // ── Admin & Management Protected Write Actions ──
        Route::middleware('role:admin,management')->group(function () {
            // Settings and thresholds modifications
            Route::put('system-settings', [SystemSettingController::class, 'update']);
            Route::post('thresholds/bulk-update', [ThresholdController::class, 'bulkUpdate']);

            // Cages (KJA) modifications
            Route::post('cages', [CageController::class, 'store']);
            Route::put('cages/{cage}', [CageController::class, 'update']);
            Route::patch('cages/{cage}', [CageController::class, 'update']);
            Route::delete('cages/{cage}', [CageController::class, 'destroy']);

            // Cameras modifications
            Route::post('cameras', [CameraController::class, 'store']);
            Route::put('cameras/{camera}', [CameraController::class, 'update']);
            Route::patch('cameras/{camera}', [CameraController::class, 'update']);
            Route::delete('cameras/{camera}', [CameraController::class, 'destroy']);

            // Operators modifications
            Route::post('operators', [OperatorController::class, 'store']);
            Route::put('operators/{operator}', [OperatorController::class, 'update']);
            Route::patch('operators/{operator}', [OperatorController::class, 'update']);
            Route::delete('operators/{operator}', [OperatorController::class, 'destroy']);

            // Edge Gateways modifications
            Route::post('edge-gateways', [EdgeGatewayController::class, 'store']);
            Route::put('edge-gateways/{edge_gateway}', [EdgeGatewayController::class, 'update']);
            Route::patch('edge-gateways/{edge_gateway}', [EdgeGatewayController::class, 'update']);
            Route::delete('edge-gateways/{edge_gateway}', [EdgeGatewayController::class, 'destroy']);

            // IoT Nodes Master modifications
            Route::post('iot-nodes-master', [IotNodeController::class, 'store']);
            Route::put('iot-nodes-master/{iot_nodes_master}', [IotNodeController::class, 'update']);
            Route::patch('iot-nodes-master/{iot_nodes_master}', [IotNodeController::class, 'update']);
            Route::delete('iot-nodes-master/{iot_nodes_master}', [IotNodeController::class, 'destroy']);
        });
    });
});








