# Panduan Setup Integrasi n8n: Pembaca Email Shopee ke Firestore & Alert WhatsApp

Dokumen ini adalah panduan lengkap untuk mengaktifkan alur otomatisasi n8n agar setiap kali ada pembeli yang melakukan *checkout* di Shopee, data pesanan dan judul game langsung tersinkronisasi secara otomatis ke database Firestore MyGameON (`shopee_orders`), serta mengirimkan telemetri alert ke WhatsApp Business Admin jika ada upaya manipulasi.

---

## 🏗️ Diagram Alur Kerja Otomatisasi (Workflow Architecture)

```
[ Gmail Shopee: madlighifari29@gmail.com ]
  (Query: from:info@mail.shopee.co.id "Siap Dikirim")
                   │
                   ▼ (Setiap 1 Menit)
     [ 1. Node Gmail Trigger ]
                   │
                   ▼
     [ 2. Node Code Parser Engine ]
         ├─ Ekstrak Nomor Pesanan (#26091...)
         ├─ Ekstrak Username Pembeli (@farrelajah)
         ├─ Ekstrak Array Game (Single, Bundling, atau Sims 4 + CC)
         └─ Normalisasi Judul Game
                   │
                   ▼
     [ 3. Node Google Cloud Firestore ]
         └─ Upsert ke koleksi: shopee_orders/{invoice}
            (Status otomatis: 'ready')
                   │
                   ▼
[ 4. Website Klaim MyGameON: /claim ]
  Pembeli hanya input nomor pesanan ──► Game langsung terdeteksi seketika!
```

---

## 🚀 Langkah 1: Import Workflow ke n8n

1. Buka dashboard instance **n8n** Anda (baik lokal `http://localhost:5678` maupun cloud/server).
2. Di menu kiri, pilih **Workflows**.
3. Di pojok kanan atas, klik tombol menu titik tiga (**`...`**) $\rightarrow$ pilih **Import from File**.
4. Pilih file template yang telah kami sediakan di repositori:
   ```
   c:\mad\website\mygameonapp\scripts\n8n-shopee-workflow-template.json
   ```
5. Workflow dengan 6 node lengkap akan langsung tampil di kanvas n8n.

---

## 🔑 Langkah 2: Konfigurasi Kredensial Gmail (`madlighifari29@gmail.com`)

Karena toko Shopee Anda terdaftar menggunakan email pribadi (`madlighifari29@gmail.com`), kredensial Gmail harus diarahkan ke akun ini:

1. Dobel klik node **`Gmail Trigger (Shopee Orders)`**.
2. Pada bagian **Credential to connect with**, pilih **Create New Credential** $\rightarrow$ **Gmail OAuth2 API**.
3. Ikuti wizard autentikasi Google dan berikan izin akses baca email (*Read-only* / `https://www.googleapis.com/auth/gmail.readonly`).
4. **Parameter Query Filter**:
   - Field `q`: `from:info@mail.shopee.co.id "Siap Dikirim"`
   > **Catatan Penting**: Query filter ini membaca email dari Shopee secara global di seluruh akun Gmail Anda, sehingga email pesanan yang masuk ke tab **Info Terbaru** (`category:updates`) atau **Kotak Masuk** akan otomatis terbaca tanpa ada yang terlewat.
5. Mode penjadwalan: **Every Minute** (memeriksa email baru setiap 1 menit).

---

## 💾 Langkah 3: Konfigurasi Kredensial Google Cloud Firestore

Node ini bertugas menuliskan data pesanan yang telah diekstrak ke koleksi `shopee_orders` di Firestore agar halaman `/claim` dapat membacanya.

1. Dobel klik node **`Save to Firestore (shopee_orders)`**.
2. Pada bagian **Credential**, pilih **Create New Credential** $\rightarrow$ **Google Firebase and Cloud Firestore API**.
3. Buka tab baru di browser Anda ke **[Firebase Console](https://console.firebase.google.com)**:
   - Pilih project **MyGameON** Anda.
   - Klik ikon Gear (⚙️) di kiri atas $\rightarrow$ **Project Settings**.
   - Buka tab **Service Accounts**.
   - Klik tombol **Generate new private key** $\rightarrow$ konfirmasi untuk mengunduh file `.json`.
4. Buka file `.json` yang baru diunduh dengan Text Editor (Notepad / VS Code).
5. Salin seluruh isi teks JSON tersebut, lalu tempelkan ke form kredensial n8n pada bagian **Service Account Key**.
6. Simpan kredensial. Parameter operasi pada node sudah otomatis tersetel:
   - **Operation**: `upsert`
   - **Collection**: `shopee_orders`
   - **Doc ID**: `={{ $json.invoice }}`

---

## 🚨 Langkah 4: Konfigurasi Notifikasi Alert WhatsApp Admin

Node ini menerima peringatan telemetri secara real-time dari website jika ada pengguna/bot yang salah menginput nomor pesanan berulang kali (*bruteforce lockout*).

1. Salin **Production Webhook URL** dari node **`Webhook Telemetry Alert`** di n8n (contoh: `https://n8n.domain-anda.com/webhook/telemetry-alert`).
2. Masukkan URL tersebut ke file konfigurasi web Anda di `src/config/integrations.js` pada field:
   ```javascript
   INTEGRATIONS.n8n.telemetryWebhookUrl = 'https://n8n.domain-anda.com/webhook/telemetry-alert';
   ```
3. Dobel klik node **`Kirim Alert ke WA Admin (6285121309829)`**:
   - Jika menggunakan **Fonnte**: masukkan Token API Fonnte Anda pada header `Authorization`.
   - Jika menggunakan **Waha** atau gateway lain: sesuaikan format payload HTTP Request sesuai dokumentasi gateway WA Anda.
   - Nomor tujuan sudah terkonfigurasi ke nomor WhatsApp Business Anda: `6285121309829`.

---

## 🧪 Langkah 5: Uji Coba & Aktivasi Workflow

1. Klik tombol **Test workflow** di bagian bawah kanvas n8n.
2. Jika ada email Shopee yang belum terbaca atau baru masuk, n8n akan mengeksekusi alur dalam hitungan detik.
3. Buka **Firestore Console** $\rightarrow$ koleksi **`shopee_orders`**:
   - Anda akan melihat dokumen baru dengan ID nomor pesanan (contoh: `2609167HFANPAD`).
   - Rincian game, username pembeli, dan status `ready` akan terisi otomatis dan rapi.
4. Buka halaman website **`http://localhost:5173/claim`**:
   - Ketik atau tempelkan nomor pesanan tersebut $\rightarrow$ klik **Verifikasi**.
   - Seluruh game akan langsung terdeteksi otomatis tanpa perlu memilih kategori manual!
5. Jika pengujian berhasil, aktifkan toggle **Active** di pojok kanan atas n8n agar alur berjalan terus secara otomatis 24/7 di latar belakang.
