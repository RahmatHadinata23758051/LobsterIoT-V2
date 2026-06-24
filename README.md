# 🦞 Lobsense V2.0 - Backend Service (Laravel API)

Repository ini berisi kode sumber (*source code*), skema database, dan konfigurasi backend untuk platform monitoring budidaya lobster air tawar **Lobsense V2.0**. Backend dibangun sebagai REST API berkinerja tinggi menggunakan framework **Laravel 11.x**.

---

## 🛠️ Stack Teknologi & Arsitektur

Backend Lobsense V2.0 dirancang menggunakan arsitektur microservices terdekopel dan pembagian penyimpanan (*multi-database storage model*) untuk performa optimal:
1. **Laravel 11.x (PHP 8.3+)**: Inti framework untuk mengelola REST API, autentikasi, dan logika bisnis.
2. **PostgreSQL 16+**: Penyimpanan data relasional transaksional (metadata user, data kota, gateway, KJA/cages, sensor threshold, log pakan, dll).
3. **InfluxDB 2.x**: Database deret-waktu (*Time-Series DB*) untuk performa tinggi dalam menulis & membaca jutaan data telemetri sensor (Suhu air, pH, DO, TDS, Turbiditas, dll).
4. **SQLite 3 (WAL Mode)**: Cache database lokal berkinerja tinggi untuk sinkronisasi log prediksi YOLOv8 secara *in-memory* sebelum diagregasikan.
5. **Mosquitto MQTT Broker (SSL/TLS, ACL)**: Protokol pub/sub untuk menerima pesan data telemetri real-time dari ESP32 Edge Gateway pada port aman `8883`.
6. **MediaMTX & FastAPI YOLOv8**: Relay stream CCTV RTSP-ke-HLS dan pemrosesan klasifikasi perilaku lobster (agresif, aktif, makan, pasif).

---

## 📊 Skema Database Relasional (PostgreSQL 16+)

Berikut adalah detail kamus data skema tabel PostgreSQL 16+ yang digunakan untuk mempermudah pengerjaan tim backend:

### 1. `users` (Manajemen Pengguna)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik pengguna |
| `name` | VARCHAR(255) | NOT NULL | Nama lengkap pengguna |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Alamat email (untuk login) |
| `role` | ENUM | NOT NULL, DEFAULT 'operator' | Role pengguna: `'operator'`, `'management'`, `'admin'` |
| `password` | VARCHAR(255) | NOT NULL | Hash password (BCrypt) |
| `profile_picture`| VARCHAR(255) | NULL | Nama file/path foto profil |
| `remember_token` | VARCHAR(100) | NULL | Token sesi "remember me" |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tanggal dibuat |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Tanggal diubah |

### 2. `provinces` (Data Provinsi)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik provinsi |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL | Kode BPS provinsi |
| `name` | VARCHAR(100) | NOT NULL | Nama provinsi |

### 3. `cities` (Data Kota / Kabupaten)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik kota |
| `province_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi ke `provinces.id` (ON DELETE CASCADE) |
| `code` | VARCHAR(20) | UNIQUE, NOT NULL | Kode BPS kota |
| `name` | VARCHAR(100) | NOT NULL | Nama kota / kabupaten |

### 4. `edge_gateways` (Perangkat Edge Gateway)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik gateway |
| `city_id` | BIGINT | FOREIGN KEY, NULL | Relasi ke `cities.id` (ON DELETE SET NULL) |
| `serial_number` | VARCHAR(100) | UNIQUE, NOT NULL | Serial number perangkat fisik |
| `ram_memory` | VARCHAR(50) | NULL | Spesifikasi kapasitas RAM |
| `cpu_speed` | VARCHAR(50) | NULL | Spesifikasi frekuensi CPU |
| `operating_system` | VARCHAR(100) | NULL | OS perangkat (misal: Linux Armbian) |
| `runtime_framework` | VARCHAR(100) | NULL | Runtime framework (misal: Python/Go/Node) |
| `power_supply_type` | VARCHAR(100) | NULL | Sumber daya (misal: Solar Panel / AC) |
| `voltage_level` | VARCHAR(50) | NULL | Level voltase input |
| `ip_address` | VARCHAR(45) | NULL | IP Local / Public perangkat |
| `gateway_ip` | VARCHAR(45) | NULL | IP Gateway jaringan internet |
| `latitude` | DECIMAL(11,8) | NULL | Koordinat latitude instalasi |
| `longitude` | DECIMAL(11,8) | NULL | Koordinat longitude instalasi |
| `max_connected_nodes` | INT | DEFAULT 50 | Limit maksimal koneksi IoT node |
| `device_photo` | VARCHAR(255) | NULL | Path foto fisik perangkat |
| `installation_photo` | VARCHAR(255) | NULL | Path foto pemasangan di lapangan |
| `handover_signature` | VARCHAR(255) | NULL | Path tanda tangan serah terima |
| `installed_at` | TIMESTAMP | NULL | Tanggal pemasangan fisik |
| `activated_at` | TIMESTAMP | NULL | Tanggal aktivasi perangkat |
| `activated_by` | BIGINT | FOREIGN KEY, NULL | Relasi ke `users.id` (ON DELETE SET NULL) |

### 5. `iot_nodes` (Perangkat IoT Node Sensor)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik IoT node |
| `city_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi ke `cities.id` (ON DELETE CASCADE) |
| `owner_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi ke `users.id` pemilik (ON DELETE CASCADE) |
| `edge_gateway_id` | BIGINT | FOREIGN KEY, NULL | Relasi ke `edge_gateways.id` (ON DELETE SET NULL) |
| `gateway_channel_number` | BIGINT | NULL | Nomor channel relay pada gateway |
| `serial_number` | VARCHAR(100) | UNIQUE, NOT NULL | Serial number fisik node |
| `ip_address` | VARCHAR(45) | NULL | IP Local node |
| `gateway_ip` | VARCHAR(45) | NULL | IP Gateway penampung |
| `latitude` | DECIMAL(11,8) | NULL | Koordinat latitude node |
| `longitude` | DECIMAL(11,8) | NULL | Koordinat longitude node |
| `device_photo` | VARCHAR(255) | NULL | Path foto fisik node |
| `installation_photo` | VARCHAR(255) | NULL | Path foto pemasangan node |
| `handover_signature` | VARCHAR(255) | NULL | Path tanda tangan serah terima |
| `installed_at` | TIMESTAMP | NULL | Tanggal pemasangan fisik |
| `activated_at` | TIMESTAMP | NULL | Tanggal aktivasi |
| `activated_by` | BIGINT | FOREIGN KEY, NULL | Relasi ke `users.id` (ON DELETE SET NULL) |

### 6. `cages` (Manajemen KJA / Keramba Jaring Apung)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik keramba |
| `cage_code` | VARCHAR(50) | UNIQUE, NOT NULL | Kode pengenal keramba (KJA) |
| `latitude` | DECIMAL(11,8) | NOT NULL | Koordinat lokasi latitude keramba |
| `longitude` | DECIMAL(11,8) | NOT NULL | Koordinat lokasi longitude keramba |
| `volume_cubic_meters` | DOUBLE | NOT NULL | Volume kubikasi keramba |
| `structure_condition` | VARCHAR(100) | NOT NULL | Status kelayakan fisik (misal: Baik, Retak) |
| `lobster_count` | INT | DEFAULT 0 | Jumlah bibit lobster dalam keramba |
| `lobster_age_days` | INT | NULL | Umur rata-rata lobster (dalam hari) |
| `age_last_updated_at` | TIMESTAMP | NULL | Waktu pembaruan log umur lobster terakhir |

### 7. `operators` (Manajemen Operator Lapangan)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier unik operator |
| `full_name` | VARCHAR(150) | NOT NULL | Nama lengkap operator lapangan |
| `phone_number` | VARCHAR(20) | NOT NULL | Nomor telepon WA/Telp operator |
| `address` | TEXT | NOT NULL | Alamat tempat tinggal operator |

### 8. `feeding_logs` (Pencatatan Pemberian Pakan)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier log pakan |
| `cage_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi ke `cages.id` (ON DELETE CASCADE) |
| `operator_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi ke `operators.id` (ON DELETE RESTRICT) |
| `feed_session` | ENUM | NOT NULL | Waktu pakan: `'morning'`, `'afternoon'`, `'night'` |
| `feed_type` | VARCHAR(100) | NOT NULL | Jenis pakan (misal: Pellet, Ikan Rucah) |
| `weight_kg` | DOUBLE | NOT NULL | Berat pakan yang ditebar (kg) |

### 9. `cameras` (Kamera CCTV Keramba)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier kamera |
| `camera_code` | VARCHAR(50) | UNIQUE, NOT NULL | Kode pengenal CCTV fisik |
| `cage_id` | BIGINT | FOREIGN KEY, NOT NULL | Relasi monitoring ke `cages.id` (ON DELETE CASCADE) |
| `stream_url` | VARCHAR(255) | NULL | URL input stream RTSP kamera CCTV |
| `is_active` | BOOLEAN | DEFAULT FALSE | Status keaktifan kamera |

### 10. `sensor_types` (Tipe Parameter Sensor)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier tipe sensor |
| `sensor_code` | VARCHAR(50) | UNIQUE, NOT NULL | Kode parameter sensor (misal: `ph`, `tds`) |
| `value_range` | VARCHAR(100) | NULL | Batas ukur normal sensor |
| `description` | TEXT | NULL | Deskripsi sensor / parameter |

### 11. `thresholds` (Batas Aman & Kalibrasi Sensor Node)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier threshold |
| `iot_node_serial_number` | VARCHAR(100) | FOREIGN KEY, NULL | Relasi ke `iot_nodes.serial_number` (ON DELETE SET NULL) |
| `sensor_code` | VARCHAR(50) | FOREIGN KEY, NULL | Relasi ke `sensor_types.sensor_code` (ON DELETE SET NULL) |
| `value_min` | DECIMAL(8,2) | DEFAULT 0.00 | Nilai minimum ambang batas aman |
| `value_max` | DECIMAL(8,2) | DEFAULT 0.00 | Nilai maksimum ambang batas aman |
| `offset_value` | DECIMAL(8,2) | DEFAULT 0.00 | Nilai bias kalibrasi sensor (+/-) |
| `filter_rules` | VARCHAR(255) | NULL | Aturan penyaringan (misal: `clamp_extreme`) |

### 12. `maintenances` (Log Pemeliharaan Lapangan)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier tiket pemeliharaan |
| `iot_node_id` | BIGINT | FOREIGN KEY, NULL | Relasi ke `iot_nodes.id` (ON DELETE SET NULL) |
| `operator_id` | BIGINT | FOREIGN KEY, NULL | Relasi operator pelapor ke `users.id` (ON DELETE SET NULL) |
| `description` | TEXT | NOT NULL | Deskripsi kerusakan / pemeliharaan |
| `device_photo` | VARCHAR(255) | NULL | Path bukti foto perbaikan |
| `operator_signature` | VARCHAR(255) | NULL | Path tanda tangan digital operator |
| `latitude` | DECIMAL(11,8) | NULL | Latitude saat perbaikan disubmit |
| `longitude` | DECIMAL(11,8) | NULL | Longitude saat perbaikan disubmit |

### 13. `weather_reports` (Log Prakiraan Cuaca Wilayah)
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifier log cuaca |
| `province_code` | VARCHAR(20) | NOT NULL | Kode BPS provinsi |
| `city_code` | VARCHAR(20) | NOT NULL | Kode BPS kota / kabupaten |
| `district_code` | VARCHAR(20) | NOT NULL | Kode BPS kecamatan |
| `village_code` | VARCHAR(20) | NOT NULL | Kode BPS kelurahan / desa |
| `village_name` | VARCHAR(150) | NULL | Nama desa |
| `district_name` | VARCHAR(150) | NULL | Nama kecamatan |
| `city_name` | VARCHAR(150) | NULL | Nama kota / kabupaten |
| `province_name` | VARCHAR(150) | NULL | Nama provinsi |
| `temperature` | VARCHAR(50) | NULL | Suhu udara |
| `humidity` | VARCHAR(50) | NULL | Kelembapan udara |
| `wind_speed` | VARCHAR(50) | NULL | Kecepatan angin |
| `rainfall` | VARCHAR(50) | NULL | Curah hujan |
| `icon_url` | VARCHAR(255) | NULL | URL ikon grafis cuaca |
| `weather_description` | VARCHAR(255) | NULL | Deskripsi kondisi cuaca |

---

## 📁 Struktur Proyek (Layered Architecture)

Backend menggunakan pembagian layer yang bersih (*layered architecture*) di dalam direktori `app/` untuk pemisahan logika:
```bash
app/
├── Http/
│   ├── Controllers/   # Layer API (Menangani HTTP Request, Routing, & JSON Response)
│   └── Middleware/    # Penjaga Keamanan API (Sanctum Auth, Rate Limiter)
├── Services/          # Layer Logika Bisnis (CalibrationService, TelemetryProcessor, dll)
├── Repositories/      # Layer Akses Data (Query SQL, Eloquent ORM, InfluxDB SDK wrapper)
└── Models/            # Definisi Objek Data Relasional PostgreSQL
```

---

## 🚀 Memulai Instalasi & Setup Lokal

### 1. Prasyarat Sistem
Pastikan mesin lokal atau server Anda memiliki:
* PHP >= 8.3 dengan ekstensi: `pdo_pgsql`, `curl`, `mbstring`, `xml`, `zip`
* Composer (Dependency Manager untuk PHP)
* PostgreSQL 16+ & InfluxDB 2.x
* Server Mosquitto MQTT (jika ingin menguji submisi telemetri MQTT)

### 2. Langkah Instalasi
Clone repository dan masuk ke direktori backend:
```bash
composer install
```

### 3. Konfigurasi Environment (`.env`)
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan konfigurasikan koneksi database Anda:
```env
# PostgreSQL Configuration
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=lobsense_v2
DB_USERNAME=postgres
DB_PASSWORD=yourpassword

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-read-write-api-token
INFLUXDB_ORG=lobsense-org
INFLUXDB_BUCKET=telemetries
```
Jalankan command generator key aplikasi:
```bash
php artisan key:generate
```

### 4. Jalankan Migrasi Database
Jalankan migrasi untuk membuat tabel relasional di PostgreSQL:
```bash
php artisan migrate --seed
```

### 5. Jalankan Server Development
Jalankan server lokal Laravel:
```bash
php artisan serve
```
API backend sekarang dapat diakses secara lokal pada tautan: `http://127.0.0.1:8000/api/v2/`.
