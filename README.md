# Lobsense V2.0 - Backend Service (Laravel API)

Repository ini berisi kode sumber (source code) dan konfigurasi backend untuk platform monitoring budidaya lobster air tawar Lobsense V2.0. Backend dibangun sebagai REST API menggunakan framework Laravel 11.x.

## Teknologi & Arsitektur

Backend Lobsense V2.0 dirancang menggunakan pembagian penyimpanan (multi-database storage model) untuk performa optimal:
1. Laravel 11.x (PHP 8.3+) - Framework inti REST API dan logika bisnis
2. PostgreSQL 16+ - Penyimpanan data relasional transaksional (metadata user, gateway, cages, thresholds)
3. InfluxDB 2.x - Penyimpanan data time-series telemetri sensor
4. SQLite 3 (WAL Mode) - Cache log prediksi YOLOv8 lokal
5. Mosquitto MQTT Broker - Protokol pub/sub telemetri sensor
6. MediaMTX & FastAPI YOLOv8 - Relay stream CCTV dan deteksi perilaku objek

## Skema Database

![Database Schema ERD](docs/images/database_schema.png)
