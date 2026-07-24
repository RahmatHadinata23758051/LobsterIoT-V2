<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "2.0.0",
    title: "Lobsense IoT V2 API Documentation",
    description: "Dokumentasi resmi API sistem monitoring, telemetri sensor tambak, pengontrolan aerator/feeder, inferensi AI, dan manajemen perangkat Lobsense V2."
)]
#[OA\Server(
    url: "http://localhost:8000",
    description: "Lobsense API Local Server"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    name: "Authorization",
    in: "header",
    scheme: "bearer",
    bearerFormat: "JWT"
)]
abstract class Controller
{
    //
}
