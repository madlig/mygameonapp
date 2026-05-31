# Phase 0 Execution Guide — Fresh Start Strategy

**Strategi:** Wipe & Start Fresh (clean slate)

**Tujuan:** Setup foundation schema yang konsisten, no legacy mess.

**Estimasi waktu:** 1-1.5 jam

**Files:**
- `phase-0-fresh-start.js` — wipe + seed metadata + set admin
- `metadata-default-seeds.json` — default reference data (50 entries)
- `bulk-import-games.js` — import 23 games via CSV
- `games-import-template.csv` — template untuk isi data game
- `firestore.rules` — security rules baru

---

## ⚠️ SEBELUM MULAI — BACKUP DULU

Walaupun kamu mau wipe, **wajib backup dulu** untuk safety. Kalau ada yang salah, bisa restore.

### Cara cepat backup via Firebase Console:
1. Firebase Console → Firestore → ⋮ menu (pojok kanan atas)
2. Export → pilih semua collections → export to Cloud Storage
3. Kalau belum ada bucket, ikutin instruction-nya (free tier OK)
4. Tunggu sampai selesai (1-2 menit)

### Atau via gcloud CLI:
```bash
gcloud firestore export gs://YOUR-PROJECT-ID.appspot.com/backups/$(date +%Y%m%d-pre-wipe)
```

---

## Step 1: Setup Migration Environment

### 1.1 Buat folder kerja
```bash
mkdir mygameon-migration
cd mygameon-migration
```

### 1.2 Copy 5 files ke folder ini
- `phase-0-fresh-start.js`
- `metadata-default-seeds.json`
- `bulk-import-games.js`
- `games-import-template.csv`
- `firestore.rules`

### 1.3 Get Service Account Key
1. Firebase Console → ⚙️ Project Settings → Service Accounts
2. Klik "Generate New Private Key"
3. Save sebagai `serviceAccountKey.json` di folder migration

⚠️ **Tambahkan ke `.gitignore` biar nggak ke-commit:**
```
serviceAccountKey.json
```

### 1.4 Install dependencies
```bash
npm init -y
npm install firebase-admin
```

---

## Step 2: Wipe + Seed Metadata (Fresh Start)

### 2.1 Dry run dulu (preview)
```bash
node phase-0-fresh-start.js --dry-run --verbose
```

**Yang akan kamu lihat:**
```
🗑️  Part 1: Wiping collections...
  → games: 23 documents found
    [DRY] would delete 23 documents
  → gamesPrivate: empty (nothing to wipe)

📦 Part 2: Seeding metadata collections...
  → metadata/genres/entries/
    18 entries
  → metadata/tags/entries/
    14 entries
  → metadata/playModes/entries/
    8 entries
  → metadata/platforms/entries/
    10 entries

✅ Total metadata entries: 50
```

### 2.2 Kalau preview OK, execute beneran
```bash
node phase-0-fresh-start.js --execute
```

**Akan ada confirmation prompt:**
```
⚠️  WARNING: Akan menjalankan operasi DESTRUCTIVE pada Firestore!
⚠️  Collection games/ dan gamesPrivate/ akan DIHAPUS.
⚠️  Pastikan kamu sudah backup data!

Lanjutkan? Ketik "yes" untuk confirm: 
```

Ketik `yes` → tunggu sampai selesai (~1-2 menit untuk 23 games).

### 2.3 Verify di Firebase Console
- Buka Firestore Console
- Collection `games/` → harus **kosong**
- Collection `metadata/` → harus ada sub-paths:
  - `metadata/genres/entries/` → 18 docs
  - `metadata/tags/entries/` → 14 docs
  - `metadata/playModes/entries/` → 8 docs
  - `metadata/platforms/entries/` → 10 docs

---

## Step 3: Set Admin Custom Claim

Tanpa ini, security rules nggak akan kasih akses admin ke kamu.

```bash
node phase-0-fresh-start.js --execute --skip-wipe --skip-metadata --set-admin madlighifari29@gmail.com
```

(Ganti email kalau bukan email admin kamu)

**Output:**
```
👤 Part 3: Setting admin claim for madlighifari29@gmail.com...
  ✅ madlighifari29@gmail.com sekarang punya admin claim
  ⚠️  PENTING: User harus logout & login ulang agar claim aktif
```

### 3.1 Logout & login ulang
- Logout dari aplikasi MyGameON
- Login ulang
- Custom claim `admin: true` baru aktif setelah re-auth

### 3.2 Verify admin claim (optional)
Di browser DevTools setelah login:
```javascript
firebase.auth().currentUser.getIdTokenResult().then(t => console.log(t.claims))
// Should show: { admin: true, ... }
```

---

## Step 4: Deploy Firestore Security Rules

### 4.1 Pastikan firebase-tools terinstall
```bash
npm install -g firebase-tools
firebase login
```

### 4.2 Initialize firestore di project (kalau belum)
Di **root project Vue/React kamu**, bukan folder migration:
```bash
firebase init firestore
```

### 4.3 Copy isi `firestore.rules` ke file `firestore.rules` di project
Ganti isi default dengan rules baru.

### 4.4 Test rules di Console (recommended)
1. Firebase Console → Firestore → Rules tab
2. Klik "Rules Playground"
3. Test scenarios:
   - **Unauthenticated reads `games/{any}`** — should ALLOW
   - **Unauthenticated reads `gamesPrivate/{any}`** — should DENY
   - **Unauthenticated reads `metadata/genres/entries/action`** — should ALLOW
   - **Authenticated (no admin claim) reads `gamesPrivate/`** — should DENY
   - **Authenticated (with admin claim) reads `gamesPrivate/`** — should ALLOW

### 4.5 Deploy rules
```bash
firebase deploy --only firestore:rules
```

---

## Step 5: Prepare CSV untuk Bulk Import

### 5.1 Buka `games-import-template.csv`
Di folder migration kamu. File ini sudah ada 3 contoh row.

### 5.2 Isi data 23 games kamu
Per kolom:

| Kolom | Format | Contoh | Wajib? |
|---|---|---|---|
| `title` | Text | "Crysis 2 Remastered" | ✅ Wajib |
| `genres` | Comma-separated lowercase | "action,shooter" | ✅ Wajib |
| `tags` | Comma-separated lowercase | "atmospheric,modern" | ⭕ Optional |
| `platform` | Text | "PC" | Default: PC |
| `fileVersion` | Text | "v1.0" | Default: "-" |
| `fileEdition` | Text | "Standard", "GOTY" | ⭕ Optional |
| `fileSizeGB` | Number | 48 | ✅ Wajib |
| `partsCount` | Integer | 13 | Default: 1 |
| `packageType` | Text | "PRE-INSTALLED" | Default: PRE-INSTALLED |
| `playModes` | Comma-separated | "singleplayer,splitscreen" | Default: singleplayer |
| `coverImageUrl` | URL | https://... | Bisa kosong dulu |
| `description` | Long text | "Long form description..." | Bisa kosong, akan auto-gen |
| `shortDescription` | Short text | "1 sentence..." | Bisa kosong, akan auto-gen |
| `videoUrl` | YouTube URL | https://youtube.com/... | ⭕ Optional |
| `shopeeAvailable` | TRUE/FALSE | TRUE | Default: false |
| `shopeeUrl` | URL | https://shopee.co.id/... | ⭕ Optional |
| `shopeePackagePrice` | Number | 15000 | ⭕ Optional |
| `steamAppId` | Number | 268910 | ⭕ Optional |
| `steamUrl` | URL | https://store.steampowered.com/app/... | ⭕ Optional |
| `gogUrl` | URL | https://www.gog.com/game/... | ⭕ Optional |
| `epicUrl` | URL | https://store.epicgames.com/... | ⭕ Optional |
| `storageLocation` | Email/text | "mygameon@mydrivee.cloud" | ⭕ Admin only |
| `adminNotes` | Text | "BACKUP", "JANGAN DIPAKE" | ⭕ Admin only |
| `verificationStatus` | "verified", "needs_check", "rejected" | "verified" | Default: needs_check |
| `coverSourceCredit` | Text | "From MobyGames, modified v3" | ⭕ Optional |

### 5.3 Tips Mengisi
- **Genres harus dari list yang ada di metadata.** Lihat `metadata-default-seeds.json` untuk list valid:
  - action, adventure, rpg, strategy, simulation, sports, puzzle, casual, indie, racing, fighting, shooter, horror, platformer, sandbox, survival, anime, card-game
- **playModes harus dari:** singleplayer, multiplayer-local, multiplayer-online, coop-local, coop-online, splitscreen, pvp-local, pvp-online
- **fileSizeGB pakai desimal kalau perlu:** 6.48 untuk 6.48 GB
- **Field yang ada koma di teks:** kasih quote, e.g. `"action,shooter,adventure"`
- **Description multi-line:** kasih quote, e.g. `"Paragraf 1.\nParagraf 2."`

### 5.4 Save sebagai `games.csv`
```bash
# Save ke folder migration kamu sebagai games.csv
```

---

## Step 6: Bulk Import Games

### 6.1 Dry run dulu
```bash
node bulk-import-games.js games.csv --dry-run --verbose
```

**Review output:**
- Total rows ke-load
- Setiap game: title, slug, genres, size, playModes
- Tidak ada error

**Common errors:**
- "Title is required" → ada row tanpa title
- Slug duplicate → ditangani otomatis dengan suffix number
- Wrong genre → cek genres pakai value dari list yang valid

### 6.2 Kalau preview OK, execute
```bash
node bulk-import-games.js games.csv --execute
```

Konfirm dengan ketik `yes` saat prompt muncul.

### 6.3 Verify di Firebase Console
- Collection `games/` → harus ada 23 docs
- Collection `gamesPrivate/` → harus ada 23 docs (matching IDs)
- Buka satu doc → cek field-fieldnya:
  - `slug` (string)
  - `genres` (array)
  - `fileSizeBytes` (number, dalam bytes)
  - `playModes` (array)
  - `shopee` (object dengan isAvailable, url, packagePrice)
  - `officialPlatforms` (array)
  - dst.

---

## Step 7: Test End-to-End

### 7.1 Test public access
- Buka website (logged out atau incognito)
- Coba buka katalog → harus bisa lihat games
- DevTools → Network → confirm tidak ada request ke `gamesPrivate/`

### 7.2 Test admin access
- Login dengan akun admin
- Coba akses `gamesPrivate/{any-id}` lewat code:
  ```javascript
  const doc = await firestore.collection('gamesPrivate').doc('SOME_ID').get();
  console.log(doc.data()); // should work
  ```

### 7.3 Test metadata read
```javascript
const genres = await firestore.collection('metadata').doc('genres').collection('entries').get();
console.log(genres.size); // should be 18
```

---

## ✅ Phase 0 Complete!

Setelah semua step di atas berhasil:

### Apa yang Sudah Tercapai:
- ✅ Database fresh dengan schema konsisten
- ✅ Metadata reference collections siap
- ✅ Security rules melindungi admin data
- ✅ 23 games sudah re-imported dengan format baru
- ✅ Admin claim aktif untuk akun kamu

### Next: Phase 1 — Detail Page MVP
Build halaman `/game/{slug}` dengan Pattern 2 dual-link CTA.

---

## 🚨 Troubleshooting

### "ENOENT: no such file or directory, open 'serviceAccountKey.json'"
- Pastikan file ada di folder migration yang sama dengan script

### "Cannot find module 'firebase-admin'"
- Run `npm install firebase-admin`

### "Permission denied" saat write
- Service account harus punya role minimal "Cloud Datastore User" + "Firebase Admin"
- Cek di Google Cloud Console → IAM

### "Quota exceeded"
- Free tier Firestore ada limit per hari
- Tunggu reset (24 jam) atau upgrade ke Blaze plan

### CSV parsing error
- Pastikan no BOM character (save sebagai "UTF-8" bukan "UTF-8 with BOM")
- Pastikan field dengan koma di-quote: `"action,shooter"`

### Slug duplicate setelah import
- Script handle otomatis dengan `-1`, `-2` suffix
- Tapi review hasilnya — mungkin ada title yang harus di-rename

### Admin claim tidak aktif
- Logout total + login ulang
- Cek di DevTools: token claims harus include `admin: true`
- Custom claim caching bisa sampai 1 jam — kalau urgent, force token refresh:
  ```javascript
  firebase.auth().currentUser.getIdToken(true)
  ```

---

## 📞 Stuck?

Update progress dengan format:
1. Step nomor berapa
2. Output / error message lengkap (copy-paste atau screenshot)
3. Apa yang udah dicoba

Gue di sini siap debug. 🚀
