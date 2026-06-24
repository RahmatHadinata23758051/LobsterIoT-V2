# Agent Development Instruction - Frontend Service
## Lobsense V2.0 (Freshwater Lobster IoT Monitoring System)

---

## 1. Goal
Membangun frontend aplikasi web dasbor pemantauan IoT, integrasi peta dinamis, pemutaran CCTV HLS dengan overlay Canvas AI perilaku lobster, serta visualisasi data time-series ter-dekopel untuk Lobsense V2.0.

---

## 2. Requirements

### A. Presentation / UI Layer
*   Halaman login modern dengan gaya *glassmorphism* dan transisi halus.
*   Dasbor utama: Widget data sensor kualitas air tawar, visual 3D orientasi keramba (*Pitch*, *Roll*, *Yaw*), dan peta dinamis Leaflet.
*   **HlsPlayerCanvas**: Pemutar HLS CCTV dengan absolute canvas di atasnya untuk menggambar bounding boxes deteksi perilaku.
*   Halaman data master, logging pakan/pemeliharaan, dan halaman filter laporan historis.

### B. Application & Domain Layer
*   **Global State (Zustand/Context)**: Menyimpan token auth, telemetri real-time, dan status limits thresholds.
*   **Periodic Frame Capture**: Menggunakan custom hook untuk meng-capture frame dari pemutar video setiap 5 detik, mengonversinya ke Base64, mengirimkannya ke `/api/detect`, dan memetakan koordinat box hasil deteksi.
*   **Canvas Bounding Box Scaling**: Melakukan penskalaan koordinat box relatif $[x, y, w, h]$ terhadap lebar/tinggi canvas fisik di browser, dan mewarnai kotak sesuai kelas perilaku (`agresif` = merah, `aktif` = cyan, `makan` = hijau, `pasif` = abu-abu).

### C. Data Access / HTTP Layer
*   Mengintegrasikan HTTP client (Axios) yang secara otomatis menyisipkan token Authorization JWT pada setiap request API ke Backend V2.0.
*   Menangani error redirect terpusat saat status HTTP `401 Unauthorized` terdeteksi.

---

## 3. Constraints
*   **No Backend Code**: Dilarang membuat, memodifikasi, atau memanipulasi kode program backend (database kueri, MQTT server, Laravel, FastAPI) di folder `Backend`.
*   **No Code Execution for Now**: Dilarang menulis program atau kode program fungsional frontend sampai fase perencanaan ini disetujui sepenuhnya oleh user.
*   **Mock Availability**: Jika REST API backend belum siap, wajib menyediakan data sensor tiruan (*mock data*) dan mock bounding box agar UI/UX tetap dapat diverifikasi.
*   **Git Integrity**: Semua file frontend wajib berada di branch `frontend` pada subfolder `Frontend`.
*   **No AI Slop (Strict Enforcement)**: Dilarang menggunakan placeholder comments (`// TODO: implement`, `// ... rest of code unchanged`). Tulis kode fungsional secara utuh, bersih, dan aman. Hindari desain generik tanpa konsep.
*   **No Push Without Approval**: Dilarang melakukan git push ke remote repository sebelum ada instruksi atau persetujuan tertulis dari USER. Semua komit dan perubahan harus tetap berada di tingkat lokal.

---

## 4. Done When (Acceptance Criteria)
*   [ ] Halaman dasbor dan CCTV overlay AI merender video HLS dan kotak bounding box secara dinamis dengan interval 5 detik.
*   [ ] Peta Leaflet berhasil menunjukkan koordinat KJA sesuai data dari API.
*   [ ] Perubahan nilai input threshold di halaman admin secara otomatis mengubah respon warna (aman/bahaya) di widget dashboard.
*   [ ] Form log pakan dan pemeliharaan terintegrasi dengan validasi input client-side yang memadai sebelum dikirim ke API.
*   [ ] Seluruh antarmuka web responsif diakses melalui mobile browser dan desktop browser.
