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

### [Milestone 05] — Sistem Klaim Pesanan Shopee & Cloud Sync Library (Poin 7 Roadmap)
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: 
  1. Halaman `/claim` sebelumnya memiliki bug sintaks/import (`MessageSquare` tidak diimpor dari `lucide-react`, memicu crash runtime saat error), dan memanggil fungsi `n8nService.submitClaim` yang tidak terdaftar di adapter.
  2. Data klaim belum disimpan secara persisten di Firestore, pembeli tidak dapat melihat status pesanannya di `/library`, dan belum ada pencegahan pengajuan ganda untuk nomor pesanan yang sama.
- **Implementasi**:
  1. **Adapter Otomatisasi**: [`src/services/api/n8nService.js`](file:///c:/mad/website/mygameonapp/src/services/api/n8nService.js)
     - Menambahkan alias `submitClaim()` yang mengarah ke `dispatchOrderClaim()`.
     - Mempertahankan fallback otomatis ke pesan WhatsApp resmi jika n8n webhook offline.
  2. **Halaman Klaim Terpadu V2**: [`src/features/claim/ClaimOrderPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/claim/ClaimOrderPage.jsx)
     - Integrasi sesi login `useAuth()`: auto-populate alamat Gmail pembeli dan username Shopee yang tersimpan di profil.
     - Pengecekan duplikasi nomor pesanan Shopee di koleksi `claims` sebelum submit, memberikan notifikasi tanggal klaim terdahulu dan tombol konsultasi WA jika invoice sudah terdaftar.
     - Simpan data klaim terstruktur ke Firestore: koleksi global `claims` dan sub-koleksi privat `users/{uid}/claims/{id}`.
     - Auto-sync: jika pembeli memasukkan username Shopee di form klaim, profil akunnya otomatis diperbarui.
     - Pembedaan pemenuhan produk (Fulfillment):
       - **The Sims 4**: Kotak khusus License Key dengan tombol 1-klik *Salin Key* + panduan input key ke *MyGameON Ultimate Launcher* + tombol download launcher.
       - **Game PC**: Info share Google Drive + tombol langsung menuju brankas *Koleksi Game Saya*.
       - Tombol konfirmasi kilat via WhatsApp Toko dengan template pesan otomatis.
  3. **Brankas & Riwayat Klaim di Library**: [`src/features/library/UserLibraryPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/library/UserLibraryPage.jsx)
     - Menambahkan *real-time listener* koleksi `claims` berdasarkan email pembeli.
     - Menampilkan section kartu **Status Klaim Pesanan Shopee** lengkap dengan indikator status (*Menunggu Konfirmasi* / *Klaim Aktif*), invoice ID, tombol salin License Key untuk The Sims 4, dan tombol tanya admin via WhatsApp.
  4. **Keamanan Data**: [`firestore.rules`](file:///c:/mad/website/mygameonapp/firestore.rules)
     - Menambahkan aturan keamanan `claims/{claimId}`: publik dapat membuat klaim dengan validasi format invoice & email, sedangkan pembacaan hanya diizinkan untuk pemilik akun (`userId == auth.uid` atau `email == auth.token.email`) dan admin.
- **Hasil Verifikasi**:
  - `npm run build` berhasil 100% tanpa error (PASS, 11.04s).
  - HTTP Status: `GET /claim` $\rightarrow$ **200 OK**, `GET /library` $\rightarrow$ **200 OK**.

---

### [Milestone 06] — Smart Auto-Detect Klaim Shopee, Penguncian Input Manual, & Telemetri Alert WhatsApp
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: 
  1. Pembeli sebelumnya masih bisa memilih kategori dan mengetik judul game secara manual, yang berisiko manipulasi (misal checkout game murah tapi klaim game mahal) atau salah ketik nama game.
  2. Pembeli yang checkout lebih dari 1 game (multi-item) dalam 1 invoice harus klaim berkali-kali.
  3. Belum ada deteksi atau notifikasi langsung ke WhatsApp Business Admin jika ada pengunjung/bot yang mencoba-coba menebak nomor pesanan yang tidak terdaftar.
- **Implementasi**:
  1. **Penguncian Input Manual & Smart Auto-Detect V2**: [`src/features/claim/ClaimOrderPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/claim/ClaimOrderPage.jsx)
     - Menghapus total selector kategori dan input judul game manual.
     - **Langkah 1 (Verifikasi)**: Pembeli hanya memasukkan Nomor Pesanan Shopee $\rightarrow$ sistem mencari di Firestore `shopee_orders/{invoice}`.
     - **Langkah 2 (Ditemukan)**: Menampilkan kartu hijau pesanan terverifikasi (`@username_shopee`), rincian seluruh game yang dibeli (mendukung single game maupun multi-item / bundling seperti Spider-Man 2 + The Sims 3), dan konfirmasi Gmail penerima Google Drive.
     - Tombol 1-klik klaim seluruh game sekaligus ke brankas `/library` dan menandai invoice sebagai `claimed`.
  2. **Proteksi Anti-Bruteforce & Telemetri Alert WhatsApp Business**:
     - Jika nomor pesanan tidak ditemukan:
       - Sistem **TIDAK** membuka form manual.
       - Sistem mencatat log audit ke koleksi `failed_claim_attempts`.
       - Sistem menembakkan notifikasi peringatan (*Telemetry Alert*) via [`src/services/api/n8nService.js`](file:///c:/mad/website/mygameonapp/src/services/api/n8nService.js#L77-L95) ke webhook n8n agar admin menerima notifikasi darurat di WhatsApp Business secara real-time.
       - Tampilan client menampilkan tombol hijau bantuan WhatsApp Business resmi dengan pesan komplain otomatis siap kirim.
       - Perlindungan *lockout timer* 5 menit jika terjadi 3 kali percobaan salah berturut-turut.
  3. **Keamanan Firestore**: [`firestore.rules`](file:///c:/mad/website/mygameonapp/firestore.rules#L230-L255)
     - Menambahkan aturan `shopee_orders/{invoice}`: pembacaan publik untuk verifikasi, pembaruan status hanya diizinkan dari `ready` ke `claimed`.
     - Menambahkan aturan `failed_claim_attempts/{id}` untuk audit jejak percobaan tidak valid.
  4. **Template Otomatisasi n8n**: [`scripts/n8n-shopee-workflow-template.json`](file:///c:/mad/website/mygameonapp/scripts/n8n-shopee-workflow-template.json)
     - Dibuat workflow template n8n yang siap di-import:
       - Node 1: Gmail Trigger (membaca email Shopee `from:info@mail.shopee.co.id subject:"Siap Dikirim"`).
       - Node 2: Regex Code Node (ekstrak invoice, buyer, items array berulang `1.`, `2.`, Sims 4 CC variation).
       - Node 3: Webhook Telemetry Alert & Filter untuk notifikasi alert WhatsApp darurat ke nomor `6285121309829`.
  5. **Ekspor Firebase Config**: [`src/config/firebaseConfig.js`](file:///c:/mad/website/mygameonapp/src/config/firebaseConfig.js#L35)
     - Menambahkan ekspor `updateDoc` untuk kelancaran mutasi status dokumen pesanan.
- **Hasil Verifikasi**:
  - `npm run build` berhasil 100% tanpa error (PASS, 13.05s).
  - HTTP Status: `GET /claim` $\rightarrow$ **200 OK**.

---

### [Milestone 07] — Sistem Lockout Timer Akumulatif Berjenjang (Max 1 Jam) & Anti-Bypass Storage
- **Waktu Pengerjaan**: 2026-09-16
- **Latar Belakang & Masalah**: 
  1. Proteksi lockout klaim Shopee sebelumnya hanya berupa durasi flat 5 menit yang tersimpan di memori state React (`lockoutTimer`). Pengunjung/bot dapat me-refresh halaman untuk me-reset hitungan mundur dan mencoba menebak nomor invoice kembali.
  2. Belum ada eskalasi penalti waktu untuk pelaku yang berulang kali gagal setelah masa lockout berakhir.
- **Implementasi**:
  1. **Model Tangga Akumulasi Waktu (Exponential Backoff)**: [`src/features/claim/ClaimOrderPage.jsx`](file:///c:/mad/website/mygameonapp/src/features/claim/ClaimOrderPage.jsx)
     - Diterapkan tabel penalti berjenjang `LOCKOUT_TIERS` yang dipicu setiap 3 kali gagal berturut-turut:
       - **Akumulasi 1**: **5 Menit** (300 detik)
       - **Akumulasi 2**: **10 Menit** (600 detik)
       - **Akumulasi 3**: **20 Menit** (1.200 detik)
       - **Akumulasi 4**: **40 Menit** (2.400 detik)
       - **Akumulasi 5**: **60 Menit / 1 Jam** (3.600 detik — *Batas Maksimal / Cap*)
  2. **Persistensi Anti-Bypass (`localStorage`)**:
     - Kunci penyimpanan: `mygameon_claim_lockout_until`, `mygameon_claim_lockout_tier`, `mygameon_claim_active_tier`, dan `mygameon_claim_failed_attempts`.
     - Saat halaman dimuat (`mount`), sistem membaca timestamp absolut `lockoutUntil` dan menghitung sisa waktu aktual secara presisi. Refresh browser tidak dapat membatalkan atau me-reset timer penguncian.
     - Auto-cleanup: storage otomatis dibersihkan saat hitungan mundur mencapai 0 atau saat pembeli berhasil memverifikasi pesanan valid.
  3. **Antarmuka Pengguna & Indikator Sisa Percobaan**:
     - Box peringatan lockout dengan aksen merah-gelap, badge akumulasi (`Akumulasi Ke-X dari 5`), countdown digital (`MM:SS` / `HH:MM:SS`), dan tombol darurat bantuan WhatsApp Business Admin.
     - Subtext input field menampilkan indikator sisa kesempatan aktif: `Sisa: Xx percobaan` sebelum penguncian dipicu.
     - Tombol verifikasi menampilkan status real-time `Terkunci Sementara (MM:SS)`.
  4. **Telemetri Peringatan Eskalasi WhatsApp Admin**: [`src/services/api/n8nService.js`](file:///c:/mad/website/mygameonapp/src/services/api/n8nService.js)
     - `dispatchUnverifiedInvoiceAlert` kini mengirim informasi `accumulationTier` dan `lockoutDurationMin` ke webhook n8n agar admin dapat membedakan salah ketik biasa dari aktivitas brute-force berulang secara instan.
- **Hasil Verifikasi**:
  - `npm.cmd run build` sukses 100% tanpa error (PASS, 10.57s).
  - HTTP Status: `GET /claim` $\rightarrow$ **200 OK**.

---

## 📋 Rencana Kerja Berikutnya (Upcoming Tasks)
1. **Poin 2 — Pengembangan Lanjutan Fitur "Can I Run It"**:
   - Peningkatan basis data perbandingan GPU/CPU diskrit vs integrated.
   - Penambahan perkiraan performa (estimasi FPS / kelancaran resolusi 1080p, 720p).
2. **Poin 4 — Integrasi SEO & OpenGraph Dinamis**:
   - Peningkatan preview kartu media sosial saat link game dibagikan ke WhatsApp / Telegram.
