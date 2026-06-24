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

## 📊 Skema Database (ERD)

Berikut adalah visualisasi diagram hubungan entitas (Entity-Relationship Diagram) untuk database Lobsense V2.0 yang di-generate menggunakan [dbdiagram.io](https://dbdiagram.io/):

![Database Schema ERD](docs/images/database_schema.png)

> [!TIP]
> **Petunjuk Update Gambar ERD:**
> 1. Ekspor gambar diagram dari editor [dbdiagram.io](https://dbdiagram.io/) dalam format **PNG**.
> 2. Simpan gambar tersebut dengan nama `database_schema.png` di dalam folder `docs/images/` pada repositori ini.
> 3. Commit dan push gambar tersebut ke repositori remote untuk memperbarui diagram di atas.

---

## 📁 Struktur Proyek (Clean Architecture)

Backend menggunakan pembagian layer yang bersih (*layered architecture*) di dalam direktori `app/`:
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
