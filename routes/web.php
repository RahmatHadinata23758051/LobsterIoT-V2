<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Alias redirect to official Swagger UI route
Route::get('/api-documentation', function () {
    return redirect('/api/documentation');
});
