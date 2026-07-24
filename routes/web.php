<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v2\SwaggerController;

Route::get('/', function () {
    return view('welcome');
});

// Swagger API Documentation Interactive Portal
Route::get('/docs/api-docs.json', [SwaggerController::class, 'jsonSpec']);
Route::get('/api/documentation', [SwaggerController::class, 'apiDocumentation']);
Route::get('/api-documentation', [SwaggerController::class, 'apiDocumentation']);
