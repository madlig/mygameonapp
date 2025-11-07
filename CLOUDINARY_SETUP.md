# Cloudinary Setup Guide untuk MyGameON

Panduan lengkap untuk mengkonfigurasi Cloudinary sebagai pengganti Firebase Storage.

## 🎯 Mengapa Cloudinary?

- ✅ **25GB storage gratis** (vs Firebase Spark 1GB)
- ✅ **25GB bandwidth/bulan gratis** (vs Firebase Spark 10GB)
- ✅ Automatic image optimization & transformation
- ✅ CDN built-in untuk loading lebih cepat
- ✅ Tidak perlu credit card

## 📝 Langkah-Langkah Setup

### 1. Buat Akun Cloudinary (Gratis)

1. Kunjungi https://cloudinary.com/users/register/free
2. Daftar dengan email atau Google account
3. Verifikasi email Anda
4. Login ke dashboard Cloudinary

### 2. Dapatkan Credentials

Setelah login, Anda akan melihat **Dashboard** dengan informasi berikut:

- **Cloud Name**: Nama unik untuk akun Cloudinary Anda (contoh: `dmygameon`)
- **API Key**: Kunci API untuk authentication
- **API Secret**: Rahasia untuk authentication (JANGAN dibagikan!)

### 3. Buat Upload Preset

Upload preset memungkinkan upload tanpa signature (lebih mudah untuk frontend):

1. Di dashboard Cloudinary, klik **Settings** (icon gear) di pojok kanan atas
2. Pilih tab **Upload**
3. Scroll ke bawah ke bagian **Upload presets**
4. Klik **Add upload preset**
5. Konfigurasi preset:
   - **Preset name**: Beri nama, misalnya `game_covers_unsigned`
   - **Signing mode**: Pilih **Unsigned** (penting!)
   - **Folder**: Optional, bisa dikosongkan atau isi `game-covers`
   - **Use filename**: Optional, centang jika mau pakai nama file original
6. Klik **Save**
7. Catat **preset name** yang Anda buat

### 4. Konfigurasi Environment Variables

1. Copy file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit file `.env` dan tambahkan credentials Cloudinary:
   ```env
   # Cloudinary Configuration
   VITE_CLOUDINARY_CLOUD_NAME=dmygameon
   VITE_CLOUDINARY_UPLOAD_PRESET=game_covers_unsigned
   ```

3. Ganti nilai-nilai di atas dengan credentials Anda sendiri

### 5. Restart Development Server

Jika development server sedang berjalan:

```bash
# Stop server (Ctrl+C)
# Kemudian restart
npm run dev
```

## 🧪 Testing Upload

1. Login ke aplikasi
2. Buka halaman Games
3. Klik "Add New Game"
4. Upload gambar cover game
5. Save game
6. Periksa di Cloudinary Dashboard → Media Library apakah gambar ter-upload

## 🔍 Troubleshooting

### Error: "Failed to upload image to Cloudinary"

**Penyebab**: Credentials salah atau upload preset tidak unsigned

**Solusi**:
1. Cek kembali `VITE_CLOUDINARY_CLOUD_NAME` dan `VITE_CLOUDINARY_UPLOAD_PRESET`
2. Pastikan upload preset mode-nya **Unsigned**
3. Restart development server setelah ubah `.env`

### Error: "CORS policy blocked"

**Penyebab**: Domain belum diwhitelist di Cloudinary

**Solusi**:
1. Buka Cloudinary Dashboard → Settings → Security
2. Di bagian **Allowed fetch domains**, tambahkan:
   - `localhost:5173` (untuk development)
   - Domain production Anda (jika sudah deploy)
3. Save changes

### Gambar ter-upload tapi ukuran file terlalu besar

**Solusi**: Implementasi image compression sebelum upload

Tambahkan library untuk compress gambar:
```bash
npm install browser-image-compression
```

Update kode di `GameFormModal.jsx`:
```javascript
import imageCompression from 'browser-image-compression';

// Di dalam onSubmitHandler, sebelum upload:
if (coverImage) {
  // Compress image
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  const compressedImage = await imageCompression(coverImage, options);
  
  // Upload compressed image
  const formData = new FormData();
  formData.append('file', compressedImage);
  // ... rest of upload code
}
```

## 📊 Monitor Usage

Untuk memantau penggunaan Cloudinary:

1. Login ke Cloudinary Dashboard
2. Klik **Reports** di sidebar
3. Lihat **Usage & Bandwidth**
4. Monitor:
   - Storage used
   - Bandwidth used
   - Transformations used

## 🔐 Security Best Practices

1. **Jangan commit file `.env`** ke Git
   - Sudah ada di `.gitignore`
   - Gunakan `.env.example` sebagai template

2. **Gunakan Upload Preset Unsigned untuk frontend**
   - Signed upload preset butuh API Secret yang tidak boleh di frontend

3. **Set upload restrictions di Cloudinary**
   - Max file size: 10MB
   - Allowed formats: jpg, png, webp
   - Max dimensions: 2000x2000

## 🚀 Optimasi

### Auto-format dan Resize

Cloudinary bisa auto-optimize gambar saat di-load:

```javascript
// Contoh URL optimization
const optimizedUrl = coverArtUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
```

Parameter:
- `f_auto`: Auto format (convert ke WebP jika browser support)
- `q_auto`: Auto quality optimization
- `w_800`: Resize width ke 800px

### Lazy Loading

Sudah diimplementasi di `GameList.jsx` menggunakan `react-lazy-load-image-component`.

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [React Integration](https://cloudinary.com/documentation/react_integration)

## 💡 Tips

1. **Gunakan folder untuk organisasi**
   - Sudah diset di kode: `game-covers/{game-name}`
   
2. **Enable auto-backup**
   - Cloudinary punya fitur backup otomatis
   - Check di Settings → Backups

3. **Use descriptive filenames**
   - Kode sudah otomatis rename berdasarkan nama game

## ❓ FAQ

**Q: Apakah bisa import gambar yang sudah ada di Firebase Storage?**
A: Ya, bisa manual download dari Firebase Console lalu upload ulang via aplikasi.

**Q: Bagaimana jika mau pindah dari Cloudinary ke service lain nanti?**
A: Tinggal ganti kode upload di `GameFormModal.jsx`, data game tetap aman di Firestore.

**Q: Apakah perlu hapus Firebase Storage dari project?**
A: Optional. Sudah diremove dari kode, tapi bisa tetap aktif jika mau backup.

---

## ✅ Checklist Setup

- [ ] Buat akun Cloudinary
- [ ] Dapatkan Cloud Name
- [ ] Buat Upload Preset (unsigned)
- [ ] Copy `.env.example` ke `.env`
- [ ] Isi `VITE_CLOUDINARY_CLOUD_NAME`
- [ ] Isi `VITE_CLOUDINARY_UPLOAD_PRESET`
- [ ] Restart development server
- [ ] Test upload gambar
- [ ] Verify di Cloudinary Dashboard

Jika ada masalah, silakan buat issue di repository ini.
