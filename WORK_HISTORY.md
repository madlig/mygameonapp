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
  3. **Routing Register**: [`src/routes/AppRouter.jsx`](file:///c:/mad/website/mygameonapp/src/routes/AppRouter.jsx)
     - Mendaftarkan rute `/register` yang otomatis membuka tab pendaftaran.
- **Hasil Verifikasi**: Build `npm run build` sukses (PASS, 10.45s), rute `/login` dan `/register` return 200 OK.

---

## 📋 Rencana Kerja Berikutnya (Upcoming Tasks)
1. **Poin 3 — Sistem Request Game & Tracking Status**:
   - Memodifikasi alur request dari sekadar link WA ke form terstruktur dengan pembuatan Kode Tiket pelacakan (misal: `REQ-XXXX`).
   - Menyediakan halaman cek status progres request game secara real-time.
2. **Poin 7 — Sistem Klaim Pesanan Shopee & Cloud Sync di `/claim`**:
   - Membangun alur verifikasi nomor pesanan Shopee anti-bocor (kolaborasi webhook n8n / email notifikasi Shopee).
   - Memastikan game langsung masuk ke `users/{uid}.ownedGames` dan folder Google Drive terbuka otomatis setelah klaim tervalidasi.
