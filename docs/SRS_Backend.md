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

All APIs return a standardized JSON envelope:
`{ "status": "success" | "error", "message": "message", "data": {} | [] | null }`

### A. Authentication & User Profile

#### 1. Login User
*   **Endpoint:** `POST /api/v2/auth/login`
*   **Request Payload (`application/json`):**
    ```json
    {
      "email": "operator@lobsense.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Successfully authenticated!",
      "data": {
        "token": "1|abCDeFgHiJkLmNoP...",
        "user": {
          "id": 2,
          "name": "Aris Operator",
          "email": "operator@lobsense.com",
          "role": "operator",
          "profile_picture": null
        }
      }
    }
    ```
*   **Response (401 Unauthorized):**
    ```json
    {
      "status": "error",
      "message": "Email atau password yang dimasukan tidak valid.",
      "data": null
    }
    ```

#### 2. Get Profile
*   **Endpoint:** `GET /api/v2/profile`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Profile retrieved",
      "data": {
        "id": 2,
        "name": "Aris Operator",
        "email": "operator@lobsense.com",
        "role": "operator",
        "profile_picture": "images/profiles/avatar.png"
      }
    }
    ```

#### 3. Update Profile
*   **Endpoint:** `PUT /api/v2/profile`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Payload (`application/json`):**
    ```json
    {
      "name": "Aris Operator Updated",
      "email": "newemail@lobsense.com"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Profile updated successfully",
      "data": {
        "id": 2,
        "name": "Aris Operator Updated",
        "email": "newemail@lobsense.com"
      }
    }
    ```

---

### B. Device Registration & Maintenance (Field Operations)

#### 4. Validate Serial Number
*   **Endpoint:** `POST /api/v2/devices/validate-serial`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Payload (`application/json`):**
    ```json
    {
      "category": "iot_node" | "edge_gateway",
      "serial_number": "NODE-99081",
      "is_maintenance": false
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Serial number is valid.",
      "data": {
        "id": 14,
        "category": "iot_node",
        "serial_number": "NODE-99081",
        "is_activated": false
      }
    }
    ```

#### 5. Register & Activate Device
*   **Endpoint:** `POST /api/v2/devices/activate`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Payload (multipart/form-data):**
    *   `category` (string: `iot_node` or `edge_gateway`)
    *   `id` (integer)
    *   `picture` (file: JPG/PNG image)
    *   `signature` (file: PNG image containing operator signature)
    *   `latitude` (numeric decimal)
    *   `longitude` (numeric decimal)
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Device activated successfully",
      "data": null
    }
    ```

#### 6. Submit Maintenance Ticket
*   **Endpoint:** `POST /api/v2/maintenances`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Payload (multipart/form-data):**
    *   `iot_node_id` (integer)
    *   `description` (string)
    *   `picture` (file, optional)
    *   `signature` (file: PNG signature)
    *   `latitude` (numeric decimal)
    *   `longitude` (numeric decimal)
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Maintenance log registered successfully",
      "data": null
    }
    ```

---

### C. Master Data & Threshold Configurations

#### 7. Get Master Cities
*   **Endpoint:** `GET /api/v2/master/cities`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Cities retrieved",
      "data": [
        {
          "id": 1,
          "code": "3201",
          "name": "BOGOR",
          "province": {
            "id": 1,
            "code": "32",
            "name": "JAWA BARAT"
          }
        }
      ]
    }
    ```

#### 8. Retrieve Threshold Settings
*   **Endpoint:** `GET /api/v2/thresholds`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `iot_node_serial_number=NODE-99081`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Thresholds retrieved",
      "data": [
        {
          "id": 3,
          "iot_node_serial_number": "NODE-99081",
          "sensor_code": "ph",
          "value_min": 6.50,
          "value_max": 8.50,
          "offset_value": 0.00,
          "filter_rules": null
        }
      ]
    }
    ```

#### 9. Bulk Update Threshold Settings
*   **Endpoint:** `POST /api/v2/thresholds/bulk-update`
*   **Headers:** `Authorization: Bearer <token>`
*   **Request Payload (`application/json`):**
    ```json
    {
      "iot_node_serial_number": "NODE-99081",
      "thresholds": [
        {
          "sensor_code": "ph",
          "value_min": 6.50,
          "value_max": 8.50,
          "offset_value": 0.10,
          "filter_rules": "clamp_extreme"
        },
        {
          "sensor_code": "water_temperature",
          "value_min": 24.00,
          "value_max": 30.00,
          "offset_value": -0.50,
          "filter_rules": null
        }
      ]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Thresholds updated successfully",
      "data": null
    }
    ```

---

### D. IoT Telemetries & Charts (InfluxDB Powered)

#### 10. List Active IoT Nodes (For Map Markers / Sidebar)
*   **Endpoint:** `GET /api/v2/iot-nodes`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Activated nodes retrieved",
      "data": [
        {
          "id": 14,
          "serial_number": "NODE-99081",
          "ip_address": "192.168.1.100",
          "latitude": -7.69323600,
          "longitude": 108.66228400,
          "city": {
            "id": 3,
            "code": "3209",
            "name": "CIREBON"
          }
        }
      ]
    }
    ```

#### 11. Get Dashboard Telemetry (Latest & 24h Time-Series in 5m Intervals)
*   **Endpoint:** `GET /api/v2/monitoring/dashboard/{serial_number}`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Dashboard data compiled",
      "data": {
        "latest": {
          "time": "2026-06-24T10:00:00Z",
          "water_temperature": 26.5,
          "ph": 7.2,
          "tds": 250.0,
          "dissolved_oxygen": 5.8,
          "turbidity": 12.4,
          "flow_rate": 0.35,
          "pitch": 0.45,
          "roll": -1.2,
          "yaw": 180.3
        },
        "series_24h": [
          {
            "time": "2026-06-23T10:00:00Z",
            "water_temperature": 25.8,
            "ph": 7.1,
            "tds": 245.0,
            "dissolved_oxygen": 5.9
          },
          {
            "time": "2026-06-23T10:05:00Z",
            "water_temperature": 25.9,
            "ph": 7.1,
            "tds": 245.2,
            "dissolved_oxygen": 5.8
          }
        ],
        "thresholds": [
          {
            "sensor_code": "ph",
            "value_min": 6.5,
            "value_max": 8.5
          }
        ]
      }
    }
    ```

#### 12. Query Historical Telemetry Range
*   **Endpoint:** `GET /api/v2/monitoring/history/{serial_number}`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** `startDate=2026-06-01&endDate=2026-06-07&limit=100`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Historical data retrieved",
      "data": {
        "startDate": "2026-06-01",
        "endDate": "2026-06-07",
        "telemetries": [
          {
            "time": "2026-06-07T12:00:00Z",
            "water_temperature": 26.2,
            "ph": 7.3,
            "tds": 260.0,
            "dissolved_oxygen": 5.5,
            "turbidity": 11.2,
            "flow_rate": 0.3
          }
        ]
      }
    }
    ```

#### 13. Telemetry Ingestion Endpoint (IoT node upload)
*   **Endpoint:** `POST /api/v2/telemetry/submit`
*   **Headers:** `X-Device-Token: <secure-node-token>`
*   **Request Payload (`application/json`):**
    ```json
    {
      "serial_number": "NODE-99081",
      "timestamp": 1780538396,
      "raw_values": {
        "temperature_node": 28.5,
        "temperature_edge": 32.1,
        "humidity_node": 78.2,
        "humidity_edge": 65.4,
        "raw_dissolved_oxygen": 482.0,
        "turbidity": 1.25,
        "salinity": 0.0,
        "ph": 3.42,
        "tds": 210.0,
        "flow_rate": 2.4,
        "pump_status": 1
      }
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Telemetry packet received and written to TSDB"
    }
    ```

