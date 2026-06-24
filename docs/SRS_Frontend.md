# 📄 Software Requirements Specification (SRS) - Frontend Service
## Lobsense V2.0 (Freshwater Lobster IoT Monitoring System)

---

## 1. System Architecture & Tech Stack

The Frontend V2.0 is a decoupled client-side web application built for real-time sensor dashboards, geographical map views, and interactive CCTV video overlays powered by AI.

*   **Core Framework:** React 18+ (Vite)
*   **Global State Management:** Zustand
*   **Styling Engine:** TailwindCSS v4 (configured with a custom, non-generic theme using CSS variables)
*   **Interactive Maps:** Leaflet.js (via `react-leaflet`)
*   **Telemetry Charts:** Recharts
*   **Video Streaming:** `hls.js` (HLS playback support in browsers)
*   **HTTP Client:** Axios

---

## 2. Global State Stores (Zustand)

Global states are split into focused Zustand store modules:

### A. `AuthStore`
Manages login credentials and token persistence.
*   *State:* `token` (string | null), `user` (object | null), `isAuthenticated` (boolean).
*   *Actions:* `login(token, user)`, `logout()`, `updateProfile(user)`.

### B. `TelemetryStore`
Stores live and historical data segments retrieved from the backend API.
*   *State:* `activeNodeSerial` (string | null), `latestTelemetry` (object | null), `seriesData24h` (array).
*   *Actions:* `setActiveNode(serial)`, `setLatestTelemetry(data)`, `setSeriesData(array)`.

### C. `ThresholdStore`
Maintains safe-zone sensor ranges to evaluate visual alerting colors.
*   *State:* `thresholds` (array: `{ sensor_code, value_min, value_max }`).
*   *Actions:* `setThresholds(array)`, `evaluateStatus(sensor_code, value)` -> returns `'safe' | 'warning' | 'danger'`.

---

## 3. Dynamic CCTV Canvas Overlay & YOLOv8 Math

The application plays live HLS CCTV feeds and draws bounding boxes representing detected lobster behaviors (`aktif`, `pasif`, `agresif`, `makan`) in real-time.

### A. Interval Frame Capture & Predict Pipeline
1.  React plays the CCTV stream using a `<video>` tag wrapped by `hls.js`.
2.  An in-memory hidden `<canvas>` captures a frame snapshot every **5 seconds**.
3.  The snapshot is converted to a base64 Data URL and uploaded to the FastAPI `/predict` endpoint.
4.  FastAPI returns coordinates for all objects in normalized ratios $[x, y, w, h]$ ranging from `0.0` to `1.0`.

### B. Bounding Box Canvas Scaling (Contain Offset Adjustment)
To ensure bounding boxes align perfectly on top of the video when using `object-fit: contain` (which introduces horizontal or vertical black bars/letterboxing), the canvas must calculate offsets:

*   Let $V_w, V_h$ be the video's actual source dimensions (e.g. $1920 \times 1080$).
*   Let $C_w, C_h$ be the canvas element's client display width and height in the browser.
*   Calculate scales and offsets:
    $$\text{videoRatio} = \frac{V_w}{V_h}$$
    $$\text{clientRatio} = \frac{C_w}{C_h}$$
    
    $$\text{if } \text{videoRatio} > \text{clientRatio}: \quad \text{scale} = \frac{C_w}{V_w}, \quad \text{offset}_x = 0, \quad \text{offset}_y = \frac{C_h - V_h \times \text{scale}}{2}$$
    $$\text{else}: \quad \text{scale} = \frac{C_h}{V_h}, \quad \text{offset}_x = \frac{C_w - V_w \times \text{scale}}{2}, \quad \text{offset}_y = 0$$

*   Apply scale and offset to draw box coordinates:
    $$\text{Box Width} = w \times V_w \times \text{scale}$$
    $$\text{Box Height} = h \times V_h \times \text{scale}$$
    $$\text{Box Left } (X) = (x \times V_w - \frac{w \times V_w}{2}) \times \text{scale} + \text{offset}_x$$
    $$\text{Box Top } (Y) = (y \times V_h - \frac{h \times V_h}{2}) \times \text{scale} + \text{offset}_y$$

### C. Behavior Colors (Anti-AI-Slop Visual Rules)
*   **`agresif`:** Bright Crimson Red (`#EF4444`) - Alerts technicians of claw fights.
*   **`makan`:** Healthy Forest Green (`#10B981`) - Identifies active feeding.
*   **`aktif`:** Soft Cyan Blue (`#06B6D4`) - Normal exploratory behavior.
*   **`pasif`:** Ambient Medium Slate Gray (`#6B7280`) - Resting behavior.

---

## 4. HTTP Client & Auth Interceptors

Axios is used to query the Backend REST API:

1.  **Request Interceptor:**
    *   Intercepts outbound HTTP requests.
    *   If a token exists in `AuthStore`, appends the header: `Authorization: Bearer <token>`.
2.  **Response Interceptor (Session Expiry Guard):**
    *   Intercepts inbound responses.
    *   If the response returns status code `401 Unauthorized`, clears local storage token caches and triggers a redirect route to `/login`.

---

## 5. REST API Client Contracts

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

