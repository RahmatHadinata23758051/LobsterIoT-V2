# 📄 Software Requirements Specification (SRS) - Backend Service
## Lobsense V2.0 (Freshwater Lobster IoT Monitoring System)

---

## 1. System Architecture & Tech Stack

The Backend V2.0 is a decoupled, layered REST API engineered for high-write telemetry ingestion, secure transactional user context, and fast AI inference proxying.

*   **Core Framework:** Laravel 11.x (PHP 8.3+)
*   **Relational Database:** PostgreSQL 16+
*   **Time-Series Database:** InfluxDB 2.x
*   **AI Log Database:** SQLite 3 (Write-Ahead Logging enabled)
*   **MQTT Broker:** Private Mosquitto MQTT (Port 8883, SSL/TLS, ACL authentication)
*   **Video Transcoder:** MediaMTX (Go-based RTSP-to-HLS Gateway)
*   **Authentication:** Laravel Sanctum (Bearer Token / Stateful API cookies)

---

## 2. Persistence Layer Specs

### A. PostgreSQL Schema (Relational Metadata & Configurations)

##### 1. `users`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `name` (VARCHAR(255))
*   `email` (VARCHAR(255), UNIQUE)
*   `role` (ENUM('operator', 'management', 'admin'))
*   `password` (VARCHAR(255))
*   `profile_picture` (VARCHAR(255), NULL)
*   `remember_token` (VARCHAR(100), NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 2. `provinces`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `code` (VARCHAR(20), UNIQUE)
*   `name` (VARCHAR(100))
*   `created_at`, `updated_at` (TIMESTAMP)

##### 3. `cities`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `province_id` (BIGINT UNSIGNED, FOREIGN KEY -> `provinces.id`, CASCADE)
*   `code` (VARCHAR(20), UNIQUE)
*   `name` (VARCHAR(100))
*   `created_at`, `updated_at` (TIMESTAMP)

##### 4. `edge_gateways`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `city_id` (BIGINT UNSIGNED, FOREIGN KEY -> `cities.id`, SET NULL)
*   `serial_number` (VARCHAR(100), UNIQUE)
*   `ram_memory` (VARCHAR(50), NULL)
*   `cpu_speed` (VARCHAR(50), NULL)
*   `operating_system` (VARCHAR(100), NULL)
*   `runtime_framework` (VARCHAR(100), NULL)
*   `power_supply_type` (VARCHAR(100), NULL)
*   `voltage_level` (VARCHAR(50), NULL)
*   `ip_address` (VARCHAR(45), NULL)
*   `gateway_ip` (VARCHAR(45), NULL)
*   `latitude` (DECIMAL(11, 8), NULL)
*   `longitude` (DECIMAL(11, 8), NULL)
*   `max_connected_nodes` (INT, DEFAULT 50)
*   `device_photo` (VARCHAR(255), NULL)
*   `installation_photo` (VARCHAR(255), NULL)
*   `handover_signature` (VARCHAR(255), NULL)
*   `installed_at` (DATETIME, NULL)
*   `activated_at` (DATETIME, NULL)
*   `activated_by` (BIGINT UNSIGNED, FOREIGN KEY -> `users.id`, SET NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 5. `iot_nodes`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `city_id` (BIGINT UNSIGNED, FOREIGN KEY -> `cities.id`, CASCADE)
*   `owner_id` (BIGINT UNSIGNED, FOREIGN KEY -> `users.id`, CASCADE)
*   `edge_gateway_id` (BIGINT UNSIGNED, FOREIGN KEY -> `edge_gateways.id`, SET NULL)
*   `gateway_channel_number` (BIGINT, NULL)
*   `serial_number` (VARCHAR(100), UNIQUE)
*   `ip_address` (VARCHAR(45), NULL)
*   `gateway_ip` (VARCHAR(45), NULL)
*   `latitude` (DECIMAL(11, 8), NULL)
*   `longitude` (DECIMAL(11, 8), NULL)
*   `device_photo` (VARCHAR(255), NULL)
*   `installation_photo` (VARCHAR(255), NULL)
*   `handover_signature` (VARCHAR(255), NULL)
*   `installed_at` (DATETIME, NULL)
*   `activated_at` (DATETIME, NULL)
*   `activated_by` (BIGINT UNSIGNED, FOREIGN KEY -> `users.id`, SET NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 6. `cages`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `cage_code` (VARCHAR(50), UNIQUE)
*   `latitude` (DECIMAL(11, 8))
*   `longitude` (DECIMAL(11, 8))
*   `volume_cubic_meters` (DOUBLE)
*   `structure_condition` (VARCHAR(100))
*   `lobster_count` (INT, DEFAULT 0)
*   `lobster_age_days` (INT, NULL)
*   `age_last_updated_at` (TIMESTAMP, NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 7. `operators`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `full_name` (VARCHAR(150))
*   `phone_number` (VARCHAR(20))
*   `address` (TEXT)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 8. `feeding_logs`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `cage_id` (BIGINT UNSIGNED, FOREIGN KEY -> `cages.id`, CASCADE)
*   `operator_id` (BIGINT UNSIGNED, FOREIGN KEY -> `operators.id`, RESTRICT)
*   `feed_session` (ENUM('morning', 'afternoon', 'night'))
*   `feed_type` (VARCHAR(100))
*   `weight_kg` (DOUBLE)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 9. `cameras`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `camera_code` (VARCHAR(50), UNIQUE)
*   `cage_id` (BIGINT UNSIGNED, FOREIGN KEY -> `cages.id`, CASCADE)
*   `stream_url` (VARCHAR(255), NULL)
*   `is_active` (BOOLEAN, DEFAULT FALSE)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 10. `sensor_types`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `sensor_code` (VARCHAR(50), UNIQUE)
*   `value_range` (VARCHAR(100), NULL)
*   `description` (TEXT, NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 11. `thresholds`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `iot_node_serial_number` (VARCHAR(100), FOREIGN KEY -> `iot_nodes.serial_number`, SET NULL)
*   `sensor_code` (VARCHAR(50), FOREIGN KEY -> `sensor_types.sensor_code`, SET NULL)
*   `value_min` (DECIMAL(8, 2), DEFAULT 0.00)
*   `value_max` (DECIMAL(8, 2), DEFAULT 0.00)
*   `offset_value` (DECIMAL(8, 2), DEFAULT 0.00)
*   `filter_rules` (VARCHAR(255), NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 12. `maintenances`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `iot_node_id` (BIGINT UNSIGNED, FOREIGN KEY -> `iot_nodes.id`, SET NULL)
*   `operator_id` (BIGINT UNSIGNED, FOREIGN KEY -> `users.id`, SET NULL)
*   `description` (TEXT)
*   `device_photo` (VARCHAR(255), NULL)
*   `operator_signature` (VARCHAR(255), NULL)
*   `latitude` (DECIMAL(11, 8), NULL)
*   `longitude` (DECIMAL(11, 8), NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

##### 13. `weather_reports`
*   `id` (BIGINT UNSIGNED, PRIMARY KEY, AUTO_INCREMENT)
*   `province_code` (VARCHAR(20))
*   `city_code` (VARCHAR(20))
*   `district_code` (VARCHAR(20))
*   `village_code` (VARCHAR(20))
*   `village_name` (VARCHAR(150), NULL)
*   `district_name` (VARCHAR(150), NULL)
*   `city_name` (VARCHAR(150), NULL)
*   `province_name` (VARCHAR(150), NULL)
*   `temperature` (VARCHAR(50), NULL)
*   `humidity` (VARCHAR(50), NULL)
*   `wind_speed` (VARCHAR(50), NULL)
*   `rainfall` (VARCHAR(50), NULL)
*   `icon_url` (VARCHAR(255), NULL)
*   `weather_description` (VARCHAR(255), NULL)
*   `created_at`, `updated_at` (TIMESTAMP)

---

### B. InfluxDB Telemetry Specs (Line Protocol)

All sensor metrics are stored inside the `lobsense_telemetry` bucket.

#### Measurement: `telemetries` (Calibrated Sensor Readings)
*   **Tags:** `iot_node_serial_number` (string), `cage_code` (string)
*   **Fields:** `latitude`, `longitude`, `altitude`, `pitch`, `roll`, `yaw`, `ambient_temperature`, `ambient_humidity`, `air_pressure`, `water_temperature`, `dissolved_oxygen`, `tds` (ppm), `ph`, `turbidity`, `salinity`, `flow_rate` (Float values)

#### Measurement: `raw_telemetries` (Raw Analog Readings)
*   **Tags:** `iot_node_serial_number` (string)
*   **Fields:** `temperature_node`, `temperature_edge`, `humidity_node`, `humidity_edge`, `raw_dissolved_oxygen`, `turbidity`, `salinity`, `cod`, `ph`, `orp`, `tds`, `nitrate`, `ambient_temperature`, `tss`, `water_level_cm`, `water_level_percentage`, `flow_rate`, `pump_status` (Float/Integer values)

---

## 3. REST API Endpoint Registry

All APIs return standard response formatting:
`{ "status": "success"|"error", "message": "message string", "data": {}|[]|null }`

### A. Authentication & Users
*   `POST /api/v2/auth/login` - Takes `email`, `password`. Authenticates operator/user, returns Sanctum Token and user details.
*   `GET /api/v2/profile` - Retrieves authenticated user details.
*   `PUT /api/v2/profile` - Updates name and email of authenticated user.

### B. Device Registration & Tickets
*   `POST /api/v2/devices/validate-serial` - Validates if a serial number exists in database and checks status.
*   `POST /api/v2/devices/activate` - Activation details upload (Multipart photo & signature, coordinates).
*   `POST /api/v2/maintenances` - Log maintenance report (Multipart photo & signature).

### C. Master Data & Thresholds
*   `GET /api/v2/master/cities` - Get Indonesian cities list.
*   `GET /api/v2/thresholds` - Retrieve thresholds by `iot_node_serial_number`.
*   `POST /api/v2/thresholds/bulk-update` - Updates multiple thresholds with validation rules in a single request.

### D. Live Dashboard & History (InfluxDB queries)
*   `GET /api/v2/iot-nodes` - Retrieve list of activated nodes with geographical positions.
*   `GET /api/v2/monitoring/dashboard/{serial_number}` - Returns the latest telemetry and 24h series in 5m intervals.
*   `GET /api/v2/monitoring/history/{serial_number}` - Search historical sensor logs by `startDate`, `endDate`, and `limit`.
*   `POST /api/v2/telemetry/submit` - HTTP fallback ingestion endpoint for IoT nodes (X-Device-Token protected).
