# Agent Development Instruction - Backend Service
## Lobsense V2.0 (Freshwater Lobster IoT Monitoring System)

---

## 1. Goal
Membangun backend REST API murni, modul ingesti data telemetri MQTT privat, API Proxy AI asinkronus ke FastAPI, serta sistem database relasional MySQL dan SQLite WAL ter-dekopel untuk Lobsense V2.0.

---

## 2. Requirements

### A. API / Presentation Layer
*   Menyediakan REST API endpoint untuk login, update profile, reset password, get telemetry, CRUD threshold, dan logging pakan/pemeliharaan.
*   Menyediakan endpoint `/api/detect` yang memproses Base64 data URL, mengonversi secara asinkron ke multipart form-data, dan meneruskannya ke FastAPI.
*   Validasi skema parameter input secara ketat sebelum diteruskan ke Service Layer.

### B. Application & Domain Layer
*   **`CalibrationService`**: Menghitung kalibrasi bias offset dan melakukan clamping sensor untuk parameter air tawar (Freshwater).
*   **`AIPredictionService`**: Mem-proxy request gambar, menghitung distribusi persentase kelas perilaku (`agresif`, `aktif`, `makan`, `pasif`), dan memicu logging data log.
*   **`ReportGenerationService`**: Logika filter data historis dan ekspor dokumen PDF/Excel.

### C. Data Access & Persistence Layer
*   **MySQL Database**: CRUD data master (KJA, IoT node, Edge, User) dan penyimpanan time-series telemetri kualitas air tawar.
*   *Perbaikan Kolom*: TDS harus masuk ke kolom `tds` secara mandiri. Kolom `dissolved_oxygen` hanya menyimpan data DO fisik.
*   **SQLite Database**: Menyimpan log prediksi JSON ke tabel `log_predictions` dengan performa tinggi.

### D. Infrastructure & Cross-Cutting Layer
*   **MQTT Subscriber**: Menyambung ke Private Mosquitto MQTT Broker (port 8883, SSL/TLS) dengan autentikasi ACL.
*   **SQLite WAL Configuration**: Driver SQLite harus di-bootstrap dengan `journal_mode=WAL` dan `busy_timeout=5000` untuk mitigasi deadlock concurrency.
*   **Rate Limiting & Caching**: Batasi request `/api/detect` (max 20 req/menit per IP) dan cache data telemetri real-time selama 30 detik.

---

## 3. Constraints
*   **No Frontend Code**: Jangan menulis, mengubah, atau menyentuh berkas UI, HTML, CSS, JavaScript client-side di folder `Frontend`.
*   **No Code Execution for Now**: Dilarang menulis program atau kode program backend fungsional sampai fase perencanaan dan PRD ini disetujui sepenuhnya oleh user.
*   **Freshwater Metrics**: Parameter salinitas dinonaktifkan. Gunakan threshold air tawar default (Suhu: 24-30°C, pH: 6.5-8.5, TDS: 150-400 ppm, DO: > 5 mg/L).
*   **Git Integrity**: Semua file backend wajib berada di branch `backend` pada subfolder `Backend`.
*   **No AI Slop (Strict Enforcement)**: Dilarang menggunakan placeholder comments (`// TODO: implement`, `// ... rest of code unchanged`). Tulis kode fungsional secara utuh, bersih, dan aman.


---

## 4. Done When (Acceptance Criteria)
*   [ ] Seluruh skema database MySQL (`monitoring_telemetries`, `tresholds`, dll.) dan database SQLite (`log_predictions` mode WAL) terinisiasi dengan benar.
*   [ ] Endpoint `/api/detect` berhasil mengembalikan data JSON kelas perilaku dari server FastAPI dengan latensi < 200ms.
*   [ ] Log data sensor tersimpan dengan benar di MySQL, di mana data TDS dipisahkan secara penuh ke kolom `tds` (bukan di kolom `dissolved_oxygen`).
*   [ ] Penarikan data historis `/api/report/...` menghasilkan file PDF dan Excel yang terisi data secara valid.
*   [ ] Seluruh kueri database terlindung dari SQL Injection dengan prepared statements.
