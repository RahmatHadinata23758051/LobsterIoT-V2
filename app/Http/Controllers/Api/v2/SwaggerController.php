<?php

namespace App\Http\Controllers\Api\v2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SwaggerController extends Controller
{
    /**
     * Serve OpenAPI JSON Specification.
     */
    public function jsonSpec()
    {
        $spec = [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'Lobsense IoT V2 API Documentation',
                'description' => 'Dokumentasi resmi API sistem monitoring, telemetri sensor tambak, pengontrolan aerator/feeder, inferensi AI, dan manajemen perangkat Lobsense V2.',
                'version' => '2.0.0',
                'contact' => [
                    'name' => 'Tim Pengembang Lobsense IoT',
                    'email' => 'support@lobsense.id'
                ]
            ],
            'servers' => [
                [
                    'url' => url('/'),
                    'description' => 'Server Utama Lobsense Backend'
                ]
            ],
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'JWT',
                        'description' => 'Masukkan Bearer Token yang didapatkan dari endpoint POST /api/v2/auth/login'
                    ]
                ]
            ],
            'tags' => [
                ['name' => 'Authentication', 'description' => 'Otentikasi pengguna & manajemen sesi'],
                ['name' => 'Monitoring & Telemetry', 'description' => 'Monitoring telemetri sensor suhu, pH, DO, salinitas, dan turbiditas tambak'],
                ['name' => 'Feeding & Aerator Control', 'description' => 'Manajemen log pemberian pakan dan kontrol relay aerator/kincir air'],
                ['name' => 'AI Prediction Proxy', 'description' => 'Inferensi Computer Vision YOLOv8 untuk deteksi perilaku lobster'],
                ['name' => 'Device Operations', 'description' => 'Validasi nomor seri pabrikan, aktivasi unit, dan laporan pemeliharaan'],
                ['name' => 'System Settings & Weather', 'description' => 'Pengaturan branding logo instansi dan data cuaca real-time'],
                ['name' => 'Reports & Exports', 'description' => 'Laporan terstruktur dan ekspor dokumen PDF, Excel, & CSV'],
                ['name' => 'Master Data CRUD', 'description' => 'Manajemen master data keramba, kamera CCTV, teknisi, edge gateway, dan iot node']
            ],
            'paths' => [
                // ── Authentication Endpoints ─────────────────────────
                '/api/v2/auth/login' => [
                    'post' => [
                        'tags' => ['Authentication'],
                        'summary' => 'Login Pengguna',
                        'description' => 'Autentikasi pengguna menggunakan email/username dan password.',
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['email', 'password'],
                                        'properties' => [
                                            'email' => ['type' => 'string', 'example' => 'admin@lobsense.com'],
                                            'password' => ['type' => 'string', 'example' => 'password123']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Login Berhasil',
                                'content' => [
                                    'application/json' => [
                                        'example' => [
                                            'status' => 'success',
                                            'message' => 'Login berhasil',
                                            'data' => [
                                                'token' => '1|laravel_sanctum_bearer_token...',
                                                'user' => [
                                                    'id' => 1,
                                                    'name' => 'Administrator Tambak',
                                                    'email' => 'admin@lobsense.com',
                                                    'role' => 'admin'
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ],
                            '401' => ['description' => 'Kredensial tidak valid']
                        ]
                    ]
                ],
                '/api/v2/auth/logout' => [
                    'post' => [
                        'tags' => ['Authentication'],
                        'summary' => 'Logout Pengguna',
                        'security' => [['bearerAuth' => []]],
                        'responses' => [
                            '200' => ['description' => 'Logout berhasil dan token dicabut']
                        ]
                    ]
                ],
                '/api/v2/profile' => [
                    'get' => [
                        'tags' => ['Authentication'],
                        'summary' => 'Get Profil Pengguna',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Data profil berhasil diambil']]
                    ],
                    'put' => [
                        'tags' => ['Authentication'],
                        'summary' => 'Update Profil Pengguna',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'name' => ['type' => 'string'],
                                            'phone' => ['type' => 'string'],
                                            'password' => ['type' => 'string']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Profil berhasil diperbarui']]
                    ]
                ],

                // ── Monitoring & Telemetry Endpoints ────────────────
                '/api/v2/iot-nodes' => [
                    'get' => [
                        'tags' => ['Monitoring & Telemetry'],
                        'summary' => 'Daftar Unit IoT Node Aktif',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Daftar unit IoT Node aktif retrieved']]
                    ]
                ],
                '/api/v2/monitoring/dashboard/{serial_number}' => [
                    'get' => [
                        'tags' => ['Monitoring & Telemetry'],
                        'summary' => 'Data Telemetri Dasbor Real-time',
                        'security' => [['bearerAuth' => []]],
                        'parameters' => [
                            ['name' => 'serial_number', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'DEMO-NODE-001']]
                        ],
                        'responses' => ['200' => ['description' => 'Data telemetri terbaru, grafik 24 jam, dan ambang batas sensor']]
                    ]
                ],
                '/api/v2/monitoring/history/{serial_number}' => [
                    'get' => [
                        'tags' => ['Monitoring & Telemetry'],
                        'summary' => 'Data Riwayat Grafik Telemetri',
                        'security' => [['bearerAuth' => []]],
                        'parameters' => [
                            ['name' => 'serial_number', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'example' => 'DEMO-NODE-001']],
                            ['name' => 'range', 'in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['1h', '6h', '24h', '7d'], 'default' => '24h']]
                        ],
                        'responses' => ['200' => ['description' => 'Deret waktu histori telemetri']]
                    ]
                ],

                // ── Feeding & Aerator Endpoints ──────────────────────
                '/api/v2/feeding-logs' => [
                    'get' => [
                        'tags' => ['Feeding & Aerator Control'],
                        'summary' => 'Daftar Log Pemberian Pakan',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Daftar log pakan']]
                    ],
                    'post' => [
                        'tags' => ['Feeding & Aerator Control'],
                        'summary' => 'Tambah Log Pemberian Pakan',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['iot_node_serial_number', 'amount_kg', 'feed_type'],
                                        'properties' => [
                                            'iot_node_serial_number' => ['type' => 'string', 'example' => 'DEMO-NODE-001'],
                                            'amount_kg' => ['type' => 'number', 'example' => 2.5],
                                            'feed_type' => ['type' => 'string', 'example' => 'Pellet Protein Tinggi'],
                                            'notes' => ['type' => 'string', 'example' => 'Pakan pagi rutin']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Log pakan berhasil ditambahkan']]
                    ]
                ],
                '/api/v2/mobile/aerator/toggle' => [
                    'post' => [
                        'tags' => ['Feeding & Aerator Control'],
                        'summary' => 'Kontrol Saklar Relay Aerator / Kincir Air',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['serial_number', 'aerator_index', 'status'],
                                        'properties' => [
                                            'serial_number' => ['type' => 'string', 'example' => 'DEMO-NODE-001'],
                                            'aerator_index' => ['type' => 'integer', 'example' => 1],
                                            'status' => ['type' => 'boolean', 'example' => true]
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Status relay aerator berhasil diubah']]
                    ]
                ],

                // ── AI Prediction Endpoints ──────────────────────────
                '/api/v2/detect' => [
                    'post' => [
                        'tags' => ['AI Prediction Proxy'],
                        'summary' => 'Inferensi Computer Vision Perilaku Lobster',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['image'],
                                        'properties' => [
                                            'image' => ['type' => 'string', 'description' => 'Base64 Encoded Frame Image String']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Hasil inferensi deteksi tindakan (agresif, aktif, makan, pasif)',
                                'content' => [
                                    'application/json' => [
                                        'example' => [
                                            'status' => 'success',
                                            'message' => 'Detection completed successfully',
                                            'data' => [
                                                'total' => 2,
                                                'classes' => ['aktif' => 1, 'makan' => 1],
                                                'raw_predictions' => [
                                                    ['class' => 'aktif', 'confidence' => 0.86, 'bbox' => [0.1, 0.2, 0.5, 0.6]],
                                                    ['class' => 'makan', 'confidence' => 0.74, 'bbox' => [0.4, 0.5, 0.8, 0.9]]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ],

                // ── Device Operations Endpoints ──────────────────────
                '/api/v2/devices/validate-serial' => [
                    'post' => [
                        'tags' => ['Device Operations'],
                        'summary' => 'Validasi Nomor Seri Perangkat Pabrikan',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['category', 'serial_number'],
                                        'properties' => [
                                            'category' => ['type' => 'string', 'enum' => ['iot_node', 'edge_gateway'], 'example' => 'iot_node'],
                                            'serial_number' => ['type' => 'string', 'example' => 'LOB-NODE-001']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Hasil validasi keabsahan nomor seri']]
                    ]
                ],
                '/api/v2/devices/activate' => [
                    'post' => [
                        'tags' => ['Device Operations'],
                        'summary' => 'Aktivasi & Penempatan Perangkat Baru',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'multipart/form-data' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['id', 'category', 'city_id', 'latitude', 'longitude', 'picture', 'signature'],
                                        'properties' => [
                                            'id' => ['type' => 'integer', 'example' => 1],
                                            'category' => ['type' => 'string', 'example' => 'iot_node'],
                                            'city_id' => ['type' => 'integer', 'example' => 5],
                                            'latitude' => ['type' => 'number', 'example' => -8.6529],
                                            'longitude' => ['type' => 'number', 'example' => 116.3195],
                                            'picture' => ['type' => 'string', 'format' => 'binary'],
                                            'signature' => ['type' => 'string', 'format' => 'binary']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Perangkat berhasil diaktifkan']]
                    ]
                ],
                '/api/v2/maintenances' => [
                    'get' => [
                        'tags' => ['Device Operations'],
                        'summary' => 'Daftar Riwayat Pemeliharaan',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Daftar log pemeliharaan']]
                    ],
                    'post' => [
                        'tags' => ['Device Operations'],
                        'summary' => 'Kirim Laporan Pemeliharaan Teknisi',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'multipart/form-data' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'required' => ['iot_node_id', 'maintenance_type', 'description', 'latitude', 'longitude', 'signature'],
                                        'properties' => [
                                            'iot_node_id' => ['type' => 'integer', 'example' => 1],
                                            'maintenance_type' => ['type' => 'string', 'enum' => ['rutin', 'perbaikan', 'kalibrasi', 'ganti_komponen'], 'example' => 'rutin'],
                                            'description' => ['type' => 'string', 'example' => 'Pembersihan probe sensor DO & pH'],
                                            'latitude' => ['type' => 'number', 'example' => -8.6529],
                                            'longitude' => ['type' => 'number', 'example' => 116.3195],
                                            'picture' => ['type' => 'string', 'format' => 'binary'],
                                            'signature' => ['type' => 'string', 'format' => 'binary']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Laporan pemeliharaan tersimpan']]
                    ]
                ],

                // ── System Settings & Weather Endpoints ──────────────
                '/api/v2/system-settings' => [
                    'get' => [
                        'tags' => ['System Settings & Weather'],
                        'summary' => 'Get Konfigurasi Branding & Sistem',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Pengaturan sistem & URL logo']]
                    ],
                    'post' => [
                        'tags' => ['System Settings & Weather'],
                        'summary' => 'Update Konfigurasi Branding & Upload Logo',
                        'security' => [['bearerAuth' => []]],
                        'requestBody' => [
                            'required' => true,
                            'content' => [
                                'multipart/form-data' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'system_logo_text' => ['type' => 'string', 'example' => 'LOBSENSE 2.0'],
                                            'system_instansi_name' => ['type' => 'string', 'example' => 'Makerindo Prima Solusi'],
                                            'logo_file' => ['type' => 'string', 'format' => 'binary']
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'responses' => ['200' => ['description' => 'Konfigurasi branding & logo berhasil diperbarui']]
                    ]
                ],
                '/api/v2/weather/latest' => [
                    'get' => [
                        'tags' => ['System Settings & Weather'],
                        'summary' => 'Data Cuaca BMKG Terbaru',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Prakiraan cuaca lokasi tambak']]
                    ]
                ],

                // ── Reports & Exports Endpoints ──────────────────────
                '/api/v2/reports' => [
                    'get' => [
                        'tags' => ['Reports & Exports'],
                        'summary' => 'Ringkasan Laporan & Data Ter-pagination (50 per Halaman)',
                        'security' => [['bearerAuth' => []]],
                        'parameters' => [
                            ['name' => 'type', 'in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['telemetry', 'feeding', 'maintenance', 'node_registration'], 'default' => 'telemetry']],
                            ['name' => 'start_date', 'in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date']],
                            ['name' => 'end_date', 'in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date']],
                            ['name' => 'page', 'in' => 'query', 'schema' => ['type' => 'integer', 'default' => 1]]
                        ],
                        'responses' => ['200' => ['description' => 'Ringkasan total & data terpaginasi 50 item']]
                    ]
                ],
                '/api/v2/reports/telemetry/pdf' => [
                    'get' => [
                        'tags' => ['Reports & Exports'],
                        'summary' => 'Ekspor PDF Laporan Telemetri (Full Filtered Data)',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Berkas PDF laporan telemetri']]
                    ]
                ],
                '/api/v2/reports/telemetry/excel' => [
                    'get' => [
                        'tags' => ['Reports & Exports'],
                        'summary' => 'Ekspor Excel Laporan Telemetri (Full Filtered Data)',
                        'security' => [['bearerAuth' => []]],
                        'responses' => ['200' => ['description' => 'Berkas Excel .xlsx laporan telemetri']]
                    ]
                ]
            ]
        ];

        return response()->json($spec, 200, [], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    /**
     * Render Interactive Swagger UI Page.
     */
    public function apiDocumentation()
    {
        $jsonUrl = url('/docs/api-docs.json');
        
        $html = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lobsense IoT V2 — Swagger API Documentation</title>
    <link rel="icon" type="image/png" href="/Icon.png" />
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        html { box-sizing: border-box; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body {
            margin: 0;
            background: #0f172a;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #f8fafc;
        }
        .swagger-header {
            background: #1e293b;
            border-bottom: 1px border #334155;
            padding: 16px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .swagger-header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .swagger-header-brand img {
            height: 36px;
            width: 36px;
            border-radius: 10px;
            object-fit: cover;
            background: #fff;
        }
        .swagger-header-title {
            font-size: 16px;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
        }
        .swagger-header-sub {
            font-size: 10px;
            font-weight: 700;
            color: #0D9D1B;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .swagger-ui .topbar { display: none; }
        .swagger-ui {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
            border-radius: 16px;
            margin-top: 24px;
            margin-bottom: 40px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #0f172a; font-weight: 800; }
    </style>
</head>
<body>
    <div class="swagger-header">
        <div class="swagger-header-brand">
            <img src="/Icon.png" alt="Lobsense Logo" />
            <div>
                <p class="swagger-header-title">LOBSENSE IoT V2 — SWAGGER API PORTAL</p>
                <span class="swagger-header-sub">LOBSTER SENSING SYSTEM</span>
            </div>
        </div>
        <div>
            <a href="{$jsonUrl}" target="_blank" style="color: #0D9D1B; font-weight: 700; text-decoration: none; font-size: 12px; background: #e8f5e9; padding: 8px 16px; border-radius: 8px;">
                📄 Unduh OpenAPI Spec (.json)
            </a>
        </div>
    </div>

    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "{$jsonUrl}",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                displayRequestDuration: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html']);
    }
}
