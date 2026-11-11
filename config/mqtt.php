<?php

return [
    'host' => env('MQTT_HOST', '127.0.0.1'),
    'port' => (int) env('MQTT_PORT', 1883),
    'topic' => env('MQTT_TOPIC', 'lobsense/telemetry/#'),
    'username' => env('MQTT_USERNAME'),
    'password' => env('MQTT_PASSWORD'),
    'tls_ca_file' => env('MQTT_TLS_CA_FILE'),
    'tls_verify_peer' => (bool) env('MQTT_TLS_VERIFY_PEER', true),
];
