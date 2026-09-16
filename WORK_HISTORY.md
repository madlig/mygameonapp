# MyGameON App — Riwayat & Log Pengerjaan Sistem (Work History)

Dokumen ini adalah catatan resmi (*audit trail*) dan riwayat kemajuan pengerjaan fitur, arsitektur, integrasi, dan perbaikan bug pada platform **MyGameON App** (`c:\mad\website\mygameonapp`).

---

## 📌 Status Terkini Proyek
- **Branch Git**: `feature/brand-refresh-v2`
- **Commit Hash Terakhir**: `5b45dfc` (*feat: landing v2, can-i-run-it engine, customer library, and universal auth*)
- **Environment**: Vite + React 19 + Tailwind CSS + Firebase Auth & Firestore
- **Preview Server**: Running di `http://localhost:5173` (Daemon task)
- **Status Joki & Overlay**: Subdomain `joki.mygameon.store` dan rute `/ticket/:id`, `/overlay` aman 100% dan terisolasi.

---

## 🚀 Log Milestone & Riwayat Fitur yang Diselesaikan

### [Milestone 01] — Mesin Diagnosa Hardware "Can I Run It" & Sistem Rekomendasi Game
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: Pembeli sering ragu apakah game PC yang diminati sanggup dimainkan di laptop/PC mereka. Filter tombol biasa tidak mampu mendiagnosa kecukupan RAM, VGA diskrit vs integrated, dan CPU.
- **Implementasi**:
  1. **Engine Diagnosa**: [`src/features/landing/utils/hardwareEngine.js`](file:///c:/mad/website/mygameonapp/src/features/landing/utils/hardwareEngine.js)
     - Klasifikasi 3 kelas otomatis: *Device Low Spek*, *Device Menengah*, *Device High-End*.
     - Algoritma uji *head-to-head* per komponen (CPU, RAM, GPU) dengan status *Pass/Fail* dan vonis teknis yang tegas.
  2. **Persistensi Profil**: [`src/features/landing/hooks/useDeviceProfile.js`](file:///c:/mad/website/mygameonapp/src/features/landing/hooks/useDeviceProfile.js)
     - Simpan data spek di `localStorage` (`mygameon_user_pc_profile`) dengan event sync antar-tab/komponen.
  3. **Antarmuka Pengguna**:
     - Modal 4 langkah input spek: [`src/features/landing/components/DeviceProfileModal.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/components/DeviceProfileModal.jsx).
     - Box diagnosa *head-to-head* di modal detail game: [`src/features/landing/components/CanIRunItBox.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/components/CanIRunItBox.jsx).
     - Banner status spek di katalog: [`src/features/landing/components/CatalogHardwareBanner.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/components/CatalogHardwareBanner.jsx).
- **Hasil Verifikasi**: Build `npm run build` sukses (PASS), filter rekomendasi katalog berjalan lancar.

---

### [Milestone 02] — Halaman Koleksi Game Pembeli & Banner Sinkronisasi Shopee (Poin 1 Roadmap)
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: Pembeli membutuhkan brankas terpusat untuk mengakses game yang sudah mereka beli dan langsung membuka tautan folder Google Drive resmi tanpa iklan/shortlink, serta mengaitkan akun Shopee mereka tanpa kerjaan input manual bagi admin.
- **Implementasi**:
  1. **Upgraded Auth & User Profile**: [`src/contexts/AuthContext.jsx`](file:///c:/mad/website/mygameonapp/src/contexts/AuthContext.jsx)
     - Menambahkan fungsi `loginWithGoogle()`.
     - Sinkronisasi dokumen `users/{uid}` di Firestore dengan field `shopeeUsername`, `ownedGames`, dan `role`.
     - Menghapus auto-logout bagi pembeli biasa (non-admin kini memiliki sesi valid).
  2. **Halaman Library**: [`src/features/library/UserLibraryPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/library/UserLibraryPage.jsx)
     - Rute: `/library` dan `/koleksi`.
     - State A (Belum Login): Hero brankas game + 1-klik Google Login.
     - State B (Sudah Login): Header member terverifikasi + Banner form sinkronisasi username Shopee (`users/{uid}.shopeeUsername`) + Grid daftar game bergaransi dengan tombol *"Buka Google Drive"* & bantuan WhatsApp.
  3. **Navigasi Navbar**: [`src/features/landing/components/LandingNavbar.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/components/LandingNavbar.jsx)
     - Menambahkan menu *"Game Saya"* di desktop & mobile.
     - Menampilkan nama dan avatar Google secara dinamis jika pengguna telah login.
- **Hasil Verifikasi**: Build `npm run build` sukses (PASS, 10.44s), endpoint `/library` return 200 OK.

---

### [Milestone 03] — Halaman Universal Auth (Login & Register) untuk Pembeli & Admin
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: Halaman `/login` sebelumnya dikunci eksklusif untuk Admin Panel, langsung menolak akun pembeli biasa (*Akses ditolak*), tidak menyediakan pendaftaran akun pembeli (*Register*), dan tidak ada tombol Google Sign-In.
- **Implementasi**:
  1. **Metode Registrasi di AuthContext**: [`src/contexts/AuthContext.jsx`](file:///c:/mad/website/mygameonapp/src/contexts/AuthContext.jsx)
     - Menambahkan `register(email, password, displayName, shopeeUsername)`.
     - Otomatis membuat user Firebase Auth, memperbarui `displayName`, dan membuat dokumen Firestore `users/{uid}` dengan `role: 'user'`.
  2. **Halaman Universal Login/Register**: [`src/pages/LoginPage.jsx`](file:///c:/mad/website/mygameonapp/src/pages/LoginPage.jsx)
     - Tab switcher: **[Masuk ke Akun]** dan **[Daftar Baru]**.
     - Tombol 1-klik **"Masuk dengan Akun Google"** untuk pembeli GDrive.
     - Form pendaftaran pembeli lengkap: Nama Lengkap, Email, Password, dan input opsional Username Shopee.
     - **Smart Routing Berdasarkan Role**:
       - Pembeli biasa $\rightarrow$ otomatis diarahkan ke `/library` (Koleksi Game).
       - Staf / Admin $\rightarrow$ otomatis diarahkan ke `/dashboard`.
     - Perlindungan Brute-force (*lockout timer* 5 percobaan) tetap dipertahankan.
     - Penanganan spesifik kode error Firebase: `auth/operation-not-allowed` (notifikasi ramah untuk mengaktifkan provider di Firebase Console atau memakai registrasi email) dan `auth/unauthorized-domain`.
  3. **Routing Register & Kebijakan Privasi**: [`src/routes/AppRouter.jsx`](file:///c:/mad/website/mygameonapp/src/routes/AppRouter.jsx)
     - Mendaftarkan rute `/register` yang otomatis membuka tab pendaftaran.
     - Membuat halaman resmi Kebijakan Privasi di [`src/pages/PrivacyPolicyPage.jsx`](file:///c:/mad/website/mygameonapp/src/pages/PrivacyPolicyPage.jsx) dan mendaftarkan rute `/privacy` serta `/terms` untuk memenuhi kepatuhan OAuth Consent Screen Google Cloud.
  4. **Strict Admin Whitelist**: [`src/contexts/AuthContext.jsx`](file:///c:/mad/website/mygameonapp/src/contexts/AuthContext.jsx) & [`src/pages/LoginPage.jsx`](file:///c:/mad/website/mygameonapp/src/pages/LoginPage.jsx)
     - Menghapus pengecekan longgar `email.includes('mygameon')` yang sebelumnya menyebabkan akun non-admin seperti `mygameonhub@gmail.com` mendapatkan status admin.
     - Mengunci hak akses admin dan dashboard secara eksklusif hanya untuk email `madlighifari29@gmail.com`.
     - Otomatis menormalkan role akun lain di Firestore menjadi `'user'`.
- **Hasil Verifikasi**: Build `npm run build` sukses (PASS, 11.06s), rute `/login`, `/register`, dan `/privacy` return 200 OK.

---

### [Milestone 04] — Sistem Request Game Terstruktur & Pelacakan Tiket Real-Time (Poin 3 Roadmap)
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: Sebelumnya, tombol request game di Landing Page dan Katalog langsung melempar pembeli ke chat WhatsApp tanpa struktur database. Pembeli tidak memiliki kode tiket untuk memantau proses penyediaan game, admin kesulitan mencatat prioritas permintaan, dan pencarian katalog yang kosong tidak mengonversi ke antrean tiket yang rapi.
- **Implementasi**:
  1. **Halaman Form Request Game V2**: [`src/features/landing/RequestGamePage.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/RequestGamePage.jsx)
     - Desain visual tema gelap V2 (`#07090E`, `#0B0F17`, aksen amber-400).
     - Auto-fill judul dari query param `?title=...` dan username Shopee dari profil akun pembeli (`useAuth()`).
     - Pembuatan kode tiket instan format unik `RQ-XXXXXX` (misal: `RQ-9KP2X7`).
     - Sistem voting & deteksi duplikat otomatis: jika game sedang dalam antrean aktif, sistem mencatat vote tambahan (`votes: increment(1)`) untuk memprioritaskan permintaan tersebut tanpa membuat tiket ganda yang membingungkan.
     - Proteksi rate limiting (cooldown 2 menit per client) & bot honeypot.
     - Pemisahan sub-koleksi privat `requests/{id}/private/contact` untuk menjaga privasi nomor WhatsApp dan username pembeli agar aman dari scraping publik.
     - Tombol 1-klik kirim tiket resmi ke WhatsApp Admin dengan pesan terformat rapi.
  2. **Halaman Pelacakan Tiket Real-Time V2**: [`src/features/landing/RequestStatusPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/RequestStatusPage.jsx)
     - Desain visual V2 selaras dengan seluruh ekosistem MyGameON.
     - Auto-detect kode tiket dari query param `?code=...` atau tiket terakhir di `localStorage`.
     - Stepper 4 tahap progres visual interaktif:
       - 1. *Menunggu Review*: Pengajuan diterima di sistem.
       - 2. *Sedang Direview*: Admin mengecek ketersediaan master file & reputasi crack/repack.
       - 3. *Sedang Diproses/Upload*: File sedang diunggah ke server Google Drive berkecepatan tinggi.
       - 4. *Selesai & Siap di Katalog*: Game telah terbit di katalog dengan tombol langsung menuju detail produk.
     - Penanganan status penolakan (*rejected*) lengkap dengan catatan/alasan dari admin (misal: "Online Only / Denuvo belum terbongkar") dan opsi konsultasi ke WhatsApp.
  3. **Integrasi Seluruh Titik Masuk (Landing, Katalog, Navbar, Footer)**:
     - [`src/features/landing/LandingPageV2.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/LandingPageV2.jsx):
       - Header game: Tombol ganda `Cek Tiket` (`/request-status`) dan `Request Game` (`/request-game`).
       - Empty search state: Tombol utama `Ajukan Request Bertiket` otomatis mengoper kata kunci pencarian ke `/request-game?title=...` + tombol cadangan WhatsApp.
       - Footer: Tautan `Request Game` dan `Lacak Tiket`.
     - [`src/features/landing/CatalogPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/CatalogPage.jsx):
       - Empty search state: Tombol `Buat Tiket Request Game` membawa kata kunci pencarian.
       - Bottom banner: Akses terpadu form request, lacak tiket, dan konsultasi admin.
     - [`src/features/landing/components/LandingNavbar.jsx`](file:///c:/mad/website/mygameonapp/src/features/landing/components/LandingNavbar.jsx):
       - Menu desktop & mobile drawer dilengkapi link langsung `Request Game` dan `Lacak Tiket`.
- **Hasil Verifikasi**:
  - `npm run build` berhasil 100% tanpa error (PASS, 11.15s).
  - Verifikasi HTTP GET: `/request-game` (200 OK), `/request-status` (200 OK), `/katalog` (200 OK), `/ticket/demo` (200 OK — joki aman).

---

## 📋 Rencana Kerja Berikutnya (Upcoming Tasks)
1. **Poin 7 — Sistem Klaim Pesanan Shopee & Cloud Sync di `/claim`**:
   - Membangun alur verifikasi nomor pesanan Shopee anti-bocor (kolaborasi webhook n8n / email notifikasi Shopee).
   - Memastikan game langsung masuk ke `users/{uid}.ownedGames` dan folder Google Drive terbuka otomatis setelah klaim tervalidasi.
2. **Poin 2 — Fitur "Can I Run It" Advanced & Rekomendasi Game Dinamis**:
   - Peningkatan basis data perbandingan GPU/CPU dan fitur benchmark skor performa.
