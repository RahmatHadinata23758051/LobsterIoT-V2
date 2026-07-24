# 🖥️ Lobsense V2.0 - Frontend Web Application

Repositori ini berisi kode sumber dan antarmuka web interaktif berbasis Single Page Application (SPA) untuk platform pengawasan budidaya tambak lobster **Lobsense V2.0**. Antarmuka ini dirancang dengan estetika modern, responsif, berkinerja tinggi, dan terhubung secara real-time ke Backend API.

---

## 🎨 Teknologi & Library Utama

- **Framework Core**: React 18 (Vite Build Tool)
- **Styling & UI Design**: Vanilla CSS Custom Tokens & Tailwind CSS v3
- **Komponen Ikon**: Lucide React Icons & FontAwesome
- **Visualisasi Data & Grafik**: Chart.js & React-Chartjs-2 (Grafik real-time 24 jam untuk pH, DO, TDS, Suhu, Salinitas)
- **HTTP Client**: Axios dengan Interceptor Bearer Token Sanctum
- **Audio & Video Processing**: Canvas API untuk deteksi bounding box AI YOLOv8 pada stream CCTV real-time

---

## 📸 Tangkapan Layar Antarmuka (Screenshots)

*Petunjuk untuk Pengembang/Kontributor: Silakan letakkan file tangkapan layar antarmuka pada direktori `docs/screenshots/`.*

### 1. Halaman Login (Authentication)
> **[LETAK GAMBAR SCREENSHOT LOGIN DI SINI]**
> *Simpan file gambar screenshot halaman login Anda dengan nama `login_page.png` di folder `Frontend/docs/screenshots/login_page.png`.*

![Halaman Login Lobsense](docs/screenshots/login_page.png)

*Deskripsi*: Antarmuka autentikasi pengguna dengan enkripsi masukan, validasi gabungan kata sandi, dan pemilihan peranan (*Role-based Login*).

---

### 2. Halaman Dasbor Utama (Main Real-time Dashboard)
> **[LETAK GAMBAR SCREENSHOT DASBOR DI SINI]**
> *Simpan file gambar screenshot halaman dasbor utama Anda dengan nama `dashboard_page.png` di folder `Frontend/docs/screenshots/dashboard_page.png`.*

![Halaman Dasbor Lobsense](docs/screenshots/dashboard_page.png)

*Deskripsi*: Tampilan pusat kontrol pemantauan KJA real-time yang mencakup indikator parameter air, widget cuaca BMKG lokal, player stream CCTV dengan overlay kecerdasan buatan (AI), kontrol sakelar aerator/feeder, dan tabel log aktivitas.

---

## 🗺️ Pemetaan API Backend ↔ Fitur Antarmuka Frontend

Berikut adalah pemetaan komprehensif antara komponen antarmuka web dengan endpoint Backend API V2:

| Modul Antarmuka | Komponen UI (`src/components/`) | Endpoint API Backend | Deskripsi Fungsi |
| :--- | :--- | :--- | :--- |
| **Autentikasi** | `LoginModal.jsx` | `POST /api/v2/auth/login`<br/>`POST /api/v2/auth/logout` | Proses autentikasi pengguna & penyimpanan token Sanctum pada `localStorage`. |
| **Profil User** | `UserProfile.jsx` | `GET /api/v2/profile`<br/>`PUT /api/v2/profile` | Menampilkan dan memperbarui data profil pengguna terautentikasi. |
| **Header Status & Cuaca** | `Header.jsx`, `WeatherCard.jsx` | `GET /api/v2/weather/latest`<br/>`GET /api/v2/system-settings` | Menampilkan cuaca BMKG lokal, logo instansi, dan status sistem. |
| **Pemantauan Real-time** | `Dashboard.jsx`, `SensorCard.jsx` | `GET /api/v2/monitoring/dashboard/{serial_number}` | Mengambil indikator sensor terbaru, ambang batas, dan riwayat 24 jam. |
| **Grafik Analytics** | `TelemetryChart.jsx` | `GET /api/v2/monitoring/history/{serial_number}` | Memvisualisasikan data historis telemetri dengan resolusi fleksibel (raw, 1h, 1d). |
| **Deteksi AI CCTV** | `CctvView.jsx` | `POST /api/v2/detect`<br/>`GET /api/v2/cameras` | Mengirimkan frame canvas CCTV ke AI proxy server dan menggambar bounding box perilaku lobster. |
| **Manajemen Keramba (KJA)** | `CageManagement.jsx` | `GET /api/v2/cages`<br/>`POST /api/v2/cages`<br/>`PUT /api/v2/cages/{id}` | Pengelolaan data spasial KJA, koordinat lat/long, dan estimasi populasi lobster. |
| **Manajemen IoT Node** | `NodeManagement.jsx` | `GET /api/v2/iot-nodes-master`<br/>`POST /api/v2/iot-nodes-master` | Manajemen master IoT Node, channel gateway LoRa, dan alamat IP perangkat. |
| **Aktivasi & Pemeliharaan** | `DeviceActivation.jsx`, `MaintenanceModal.jsx` | `POST /api/v2/devices/validate-serial`<br/>`POST /api/v2/devices/activate`<br/>`POST /api/v2/maintenances` | Alur aktivasi unit perangkat baru dan submit laporan servis lapangan dengan tanda tangan digital. |
| **Pemberian Pakan** | `FeedingControl.jsx` | `GET /api/v2/feeding-logs`<br/>`POST /api/v2/feeding-logs` | Mengontrol dispenser pakan otomatis dan mencatat pakan manual. |
| **Ekspor Laporan** | `ReportExport.jsx` | `GET /api/v2/reports`<br/>`GET /api/v2/reports/{type}/{format}` | Generator dan pengunduh dokumen laporan PDF, CSV, dan Excel. |

---

## 💡 Saran & Rekomendasi Pengembangan Frontend ke Depan

1. **PWA & Offline Caching**: Mengimplementasikan Service Worker (Progressive Web App) agar web dapat diakses dalam mode pembacaan offline saat koneksi internet tambak terganggu.
2. **WebSocket Native Binding**: Menghubungkan antarmuka secara langsung ke broker WebSocket/Pusher untuk pembaruan telemetri tanpa jeda polling.
3. **WebRTC Streaming**: Mengintegrasikan protokol WebRTC ultra-low latency untuk video stream CCTV bawah air kualitas HD.

---

## ⚙️ Cara Memulai & Panduan Pengoperasian Lokal

```bash
# 1. Masuk ke direktori Frontend
cd Frontend

# 2. Install dependensi Node.js
npm install

# 3. Jalankan server pengembangan lokal
npm run dev
```

Aplikasi Frontend akan berjalan di `http://localhost:5173`.
