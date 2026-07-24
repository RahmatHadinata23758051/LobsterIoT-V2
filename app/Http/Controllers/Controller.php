<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Lobsense IoT V2 API Documentation",
 *     version="2.0.0",
 *     description="Dokumentasi API lengkap sistem monitoring & telemetri tambak lobster Lobsense V2"
 * )
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Lobsense API Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
abstract class Controller
{
    //
}
