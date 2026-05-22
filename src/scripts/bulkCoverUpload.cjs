// src/scripts/bulkCoverUpload.cjs
// ────────────────────────────────────────────────────────
// Bulk upload cover images → Firebase Storage → update Firestore
//
// Cara pakai:
//   1. Siapkan folder berisi file cover (jpg/png/webp)
//      Nama file = judul game, contoh: "Elden Ring.jpg"
//
//   2. Dry-run (preview matching):
//      node src/scripts/bulkCoverUpload.cjs "./covers" --dry-run
//
//      Ini akan menampilkan:
//      - EXACT match  → langsung siap upload
//      - FUZZY match  → disimpan ke fuzzy-review.json untuk kamu review
//      - UNMATCHED    → game baru, akan auto-create placeholder di Firestore
//
//   3. Review fuzzy matches:
//      Buka fuzzy-review.json, hapus baris yang SALAH, lalu jalankan:
//      node src/scripts/bulkCoverUpload.cjs "./covers" --apply-fuzzy
//
//   4. Upload (exact + unmatched placeholder):
//      node src/scripts/bulkCoverUpload.cjs "./covers"
//
//   Flag:
//      --dry-run       Preview saja, tidak upload/update
//      --overwrite     Timpa cover yang sudah ada
//      --apply-fuzzy   Upload fuzzy matches dari fuzzy-review.json
//      --skip-new      Jangan auto-create game baru untuk unmatched
// ────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────
const serviceAccount = require('./serviceAccountKey.json');
const STORAGE_BUCKET = 'mygameonwebsite.firebasestorage.app';
const COVERS_PATH = 'covers';
const COLLECTION = 'games';
const PRIVATE_COLLECTION = 'gamesPrivate';
const FUZZY_THRESHOLD = 0.55;
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const FUZZY_REVIEW_FILE = path.join(__dirname, 'fuzzy-review.json');
// ────────────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ── Utility: Dice coefficient similarity ────────────────
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function bigrams(str) {
  const s = normalize(str);
  const pairs = [];
  for (let i = 0; i < s.length - 1; i++) pairs.push(s.slice(i, i + 2));
  return pairs;
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const aBi = bigrams(a);
  const bBi = bigrams(b);
  if (!aBi.length && !bBi.length) return 1;
  if (!aBi.length || !bBi.length) return 0;
  const bSet = [...bBi];
  let matches = 0;
  for (const pair of aBi) {
    const idx = bSet.indexOf(pair);
    if (idx !== -1) { matches++; bSet.splice(idx, 1); }
  }
  return (2 * matches) / (aBi.length + bBi.length);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Exact match: strip semua non-alphanumeric, case-insensitive ──
function isExactMatch(fileName, gameTitle) {
  return normalize(fileName) === normalize(gameTitle);
}

// ── Humanize folder name → proper title ─────────────────
// "baldursgate3" → "Baldursgate3" (basic)
// Kamu bisa edit judul di fuzzy-review.json atau di admin panel nanti
function humanize(folderName) {
  // Split camelCase boundaries & numbers, lalu capitalize
  return folderName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Upload single file to Storage ───────────────────────
async function uploadCover(localPath, gameTitle, ext) {
  const storageName = `${slugify(gameTitle)}${ext.toLowerCase()}`;
  const destination = `${COVERS_PATH}/${storageName}`;

  await bucket.upload(localPath, {
    destination,
    metadata: {
      contentType: `image/${ext.replace('.', '').replace('jpg', 'jpeg')}`,
      cacheControl: 'public, max-age=31536000',
    },
  });

  const file = bucket.file(destination);
  await file.makePublic();
  return `https://storage.googleapis.com/${STORAGE_BUCKET}/${destination}`;
}

// ── Create placeholder game doc ─────────────────────────
async function createPlaceholderGame(title, coverUrl) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const slug = slugify(title);

  const publicData = {
    title,
    slug,
    genres: [],
    tags: [],
    platform: 'PC',
    fileVersion: '',
    fileEdition: null,
    fileSizeBytes: 0,
    partsCount: 1,
    packageType: 'repack',
    playModes: ['singleplayer'],
    coverImageUrl: coverUrl,
    screenshots: [],
    videoUrl: null,
    description: '',
    shortDescription: '',
    shopee: { isAvailable: false, url: '', packagePrice: null },
    officialPlatforms: [],
    steamAppId: null,
    relatedGameIds: [],
    relatedGamesMode: 'auto',
    availabilityStatus: 'coming_soon',
    isProblematic: false,
    lastFileUpdatedAt: now,
    lastVersionCheckAt: null,
    steamLastUpdatedAt: null,
    versionStatus: 'unchecked',
    createdAt: now,
    updatedAt: now,
  };

  const privateData = {
    storageLocations: [],
    adminNotes: '[auto-created by bulkCoverUpload]',
    verificationStatus: 'unverified',
    lastVerifiedAt: null,
    addedBy: 'bulk-cover-script',
    coverSourceCredit: '',
  };

  const batch = db.batch();
  const newRef = db.collection(COLLECTION).doc();
  batch.set(newRef, publicData);
  batch.set(db.collection(PRIVATE_COLLECTION).doc(newRef.id), privateData);
  await batch.commit();

  return newRef.id;
}

// ── Main ───────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const overwrite = args.includes('--overwrite');
  const applyFuzzy = args.includes('--apply-fuzzy');
  const skipNew = args.includes('--skip-new');
  const folderArg = args.find((a) => !a.startsWith('--'));

  if (!folderArg) {
    console.error('\x1b[31m[ERROR] Masukkan path folder cover.\x1b[0m');
    console.error('  Contoh: node src/scripts/bulkCoverUpload.cjs "./covers" --dry-run');
    process.exit(1);
  }

  const coverFolder = path.resolve(folderArg);
  if (!fs.existsSync(coverFolder) || !fs.statSync(coverFolder).isDirectory()) {
    console.error(`\x1b[31m[ERROR] Folder tidak ditemukan: ${coverFolder}\x1b[0m`);
    process.exit(1);
  }

  // ── Apply fuzzy mode ──────────────────────────────────
  //
  // fuzzy-review.json format:
  //   matchedId = "abc123"  → update game yang sudah ada
  //   matchedId = "NEW"     → buat placeholder game baru (edit matchedTitle jadi judul yang benar)
  //   Hapus baris           → skip, tidak diproses
  //
  if (applyFuzzy) {
    if (!fs.existsSync(FUZZY_REVIEW_FILE)) {
      console.error('\x1b[31m[ERROR] fuzzy-review.json tidak ditemukan. Jalankan --dry-run dulu.\x1b[0m');
      process.exit(1);
    }
    const reviewed = JSON.parse(fs.readFileSync(FUZZY_REVIEW_FILE, 'utf-8'));
    const updates = reviewed.filter((e) => e.matchedId && e.matchedId !== 'NEW');
    const creates = reviewed.filter((e) => e.matchedId === 'NEW');

    console.log(`\n\x1b[36m[INFO] Memproses fuzzy-review.json: ${updates.length} update, ${creates.length} placeholder baru\x1b[0m\n`);

    let success = 0, created = 0, fail = 0;

    // Update existing games
    for (const entry of updates) {
      const filePath = path.join(coverFolder, entry.file);
      if (!fs.existsSync(filePath)) {
        console.error(`  \x1b[31m✗\x1b[0m File tidak ditemukan: ${entry.file}`);
        fail++;
        continue;
      }
      const ext = path.extname(entry.file);
      try {
        const publicUrl = await uploadCover(filePath, entry.matchedTitle, ext);
        await db.collection(COLLECTION).doc(entry.matchedId).update({
          coverImageUrl: publicUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        success++;
        console.log(`  \x1b[32m✓\x1b[0m ${entry.file} → ${entry.matchedTitle}`);
      } catch (err) {
        fail++;
        console.error(`  \x1b[31m✗\x1b[0m ${entry.file}: ${err.message}`);
      }
    }

    // Create placeholder for NEW entries
    for (const entry of creates) {
      const filePath = path.join(coverFolder, entry.file);
      if (!fs.existsSync(filePath)) {
        console.error(`  \x1b[31m✗\x1b[0m File tidak ditemukan: ${entry.file}`);
        fail++;
        continue;
      }
      const ext = path.extname(entry.file);
      try {
        const publicUrl = await uploadCover(filePath, entry.matchedTitle, ext);
        const newId = await createPlaceholderGame(entry.matchedTitle, publicUrl);
        created++;
        console.log(`  \x1b[35m✓\x1b[0m ${entry.file} → NEW "${entry.matchedTitle}" (${newId})`);
      } catch (err) {
        fail++;
        console.error(`  \x1b[31m✗\x1b[0m ${entry.file}: ${err.message}`);
      }
    }

    console.log(`\n\x1b[36m[SELESAI] Fuzzy: ${success} update, ${created} placeholder baru, ${fail} gagal.\x1b[0m\n`);
    return;
  }

  // ── Normal mode ───────────────────────────────────────

  // 1. Baca file dari folder
  const files = fs.readdirSync(coverFolder).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return VALID_EXT.has(ext) && !f.startsWith('.');
  });

  if (!files.length) {
    console.error('\x1b[33m[WARN] Tidak ada file gambar di folder tersebut.\x1b[0m');
    process.exit(0);
  }

  console.log(`\n\x1b[36m[INFO] Ditemukan ${files.length} file cover di ${coverFolder}\x1b[0m\n`);

  // 2. Fetch semua game dari Firestore
  const snapshot = await db.collection(COLLECTION).get();
  const games = snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title || doc.data().name || '',
    slug: doc.data().slug || '',
    coverImageUrl: doc.data().coverImageUrl || doc.data().coverArtUrl || '',
  }));

  console.log(`\x1b[36m[INFO] ${games.length} game ditemukan di Firestore\x1b[0m\n`);

  // 3. Kategorikan: exact / fuzzy / unmatched
  const exactMatches = [];
  const fuzzyMatches = [];
  const unmatchedFiles = [];
  const skipped = [];

  for (const file of files) {
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    // Exact match (stripped non-alphanumeric)
    const exactGame = games.find((g) => isExactMatch(baseName, g.title));
    if (exactGame) {
      if (exactGame.coverImageUrl && !overwrite) {
        skipped.push({ file, game: exactGame.title, reason: 'sudah punya cover' });
      } else {
        exactMatches.push({ file, game: exactGame, ext });
      }
      continue;
    }

    // Slug match (baseName vs slug field)
    const slugGame = games.find((g) => g.slug && normalize(baseName) === normalize(g.slug));
    if (slugGame) {
      if (slugGame.coverImageUrl && !overwrite) {
        skipped.push({ file, game: slugGame.title, reason: 'sudah punya cover' });
      } else {
        exactMatches.push({ file, game: slugGame, ext });
      }
      continue;
    }

    // Fuzzy match
    let bestMatch = null;
    let bestScore = 0;
    for (const g of games) {
      const score = Math.max(
        similarity(baseName, g.title),
        similarity(baseName, g.slug)
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = g;
      }
    }

    if (bestMatch && bestScore >= FUZZY_THRESHOLD) {
      if (bestMatch.coverImageUrl && !overwrite) {
        skipped.push({ file, game: bestMatch.title, reason: 'sudah punya cover (fuzzy)' });
      } else {
        fuzzyMatches.push({ file, game: bestMatch, score: bestScore, ext });
      }
    } else {
      unmatchedFiles.push({ file, baseName, closest: bestMatch?.title || '-', score: bestScore, ext });
    }
  }

  // 4. Tampilkan hasil
  console.log('\x1b[32m── EXACT MATCH (siap upload) ────────────────────\x1b[0m');
  if (exactMatches.length) {
    for (const m of exactMatches) {
      console.log(`  \x1b[32m✓\x1b[0m ${m.file}  →  ${m.game.title}`);
    }
  } else {
    console.log('  (tidak ada)');
  }

  if (fuzzyMatches.length) {
    console.log(`\n\x1b[33m── FUZZY MATCH (perlu review) ───────────────────\x1b[0m`);
    for (const m of fuzzyMatches) {
      console.log(`  \x1b[33m~${(m.score * 100).toFixed(0)}%\x1b[0m  ${m.file}  →  ${m.game.title}`);
    }
  }

  if (unmatchedFiles.length) {
    console.log(`\n\x1b[35m── UNMATCHED (akan auto-create placeholder) ─────\x1b[0m`);
    for (const u of unmatchedFiles) {
      const title = humanize(u.baseName);
      console.log(`  \x1b[35m+\x1b[0m ${u.file}  →  \x1b[35mNEW:\x1b[0m "${title}"`);
    }
  }

  if (skipped.length) {
    console.log('\n\x1b[90m── SKIPPED (sudah punya cover) ──────────────────\x1b[0m');
    for (const s of skipped) {
      console.log(`  \x1b[90m⏭  ${s.file}  →  ${s.game}\x1b[0m`);
    }
  }

  console.log(`\n  Ringkasan:`);
  console.log(`    \x1b[32m${exactMatches.length}\x1b[0m exact match → langsung upload`);
  console.log(`    \x1b[33m${fuzzyMatches.length}\x1b[0m fuzzy match → simpan ke fuzzy-review.json`);
  console.log(`    \x1b[35m${unmatchedFiles.length}\x1b[0m unmatched   → auto-create placeholder`);
  console.log(`    \x1b[90m${skipped.length}\x1b[0m skipped     → sudah punya cover\n`);

  // 5. Simpan fuzzy matches ke file untuk review (JANGAN overwrite yang sudah ada)
  if (fuzzyMatches.length) {
    if (fs.existsSync(FUZZY_REVIEW_FILE)) {
      console.log(`\x1b[33m[INFO] fuzzy-review.json sudah ada — TIDAK di-overwrite.\x1b[0m`);
      console.log(`       Hapus file tersebut dulu jika ingin generate ulang.\n`);
    } else {
      const reviewData = fuzzyMatches.map((m) => ({
        file: m.file,
        matchedTitle: m.game.title,
        matchedId: m.game.id,
        score: Math.round(m.score * 100),
        _instruction: 'BENAR: biarkan. SALAH tapi game ada: ganti matchedId & matchedTitle. SALAH & game belum ada: ganti matchedId jadi "NEW" & tulis judul yang benar di matchedTitle. SKIP: hapus baris ini.',
      }));
      fs.writeFileSync(FUZZY_REVIEW_FILE, JSON.stringify(reviewData, null, 2), 'utf-8');
      console.log(`\x1b[33m[INFO] Fuzzy matches disimpan ke: ${FUZZY_REVIEW_FILE}\x1b[0m`);
      console.log(`       Edit file tersebut, lalu jalankan: --apply-fuzzy\n`);
    }
  }

  if (dryRun) {
    console.log('\x1b[36m[DRY-RUN] Selesai — tidak ada yang diupload/diupdate.\x1b[0m');
    process.exit(0);
  }

  // 6. Upload exact matches
  if (exactMatches.length) {
    console.log('\x1b[36m[UPLOAD] Exact matches...\x1b[0m\n');
    let success = 0, fail = 0;

    for (const m of exactMatches) {
      const filePath = path.join(coverFolder, m.file);
      try {
        const publicUrl = await uploadCover(filePath, m.game.title, m.ext);
        await db.collection(COLLECTION).doc(m.game.id).update({
          coverImageUrl: publicUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        success++;
        console.log(`  \x1b[32m✓\x1b[0m ${m.file} → ${publicUrl}`);
      } catch (err) {
        fail++;
        console.error(`  \x1b[31m✗\x1b[0m ${m.file}: ${err.message}`);
      }
    }
    console.log(`\n  Exact: \x1b[32m${success} berhasil\x1b[0m, ${fail} gagal\n`);
  }

  // 7. Auto-create placeholders + upload cover untuk unmatched
  if (unmatchedFiles.length && !skipNew) {
    console.log('\x1b[35m[CREATE] Auto-create placeholder games + upload cover...\x1b[0m\n');
    let created = 0, fail = 0;

    for (const u of unmatchedFiles) {
      const title = humanize(u.baseName);
      const filePath = path.join(coverFolder, u.file);
      try {
        // Upload cover dulu
        const publicUrl = await uploadCover(filePath, title, u.ext);
        // Create placeholder game di Firestore
        const newId = await createPlaceholderGame(title, publicUrl);
        created++;
        console.log(`  \x1b[35m✓\x1b[0m ${u.file} → NEW "${title}" (${newId})`);
      } catch (err) {
        fail++;
        console.error(`  \x1b[31m✗\x1b[0m ${u.file}: ${err.message}`);
      }
    }
    console.log(`\n  Placeholder: \x1b[35m${created} dibuat\x1b[0m, ${fail} gagal\n`);
  }

  if (fuzzyMatches.length) {
    console.log('\x1b[33m[REMINDER] Jangan lupa review fuzzy-review.json lalu jalankan --apply-fuzzy\x1b[0m\n');
  }

  console.log('\x1b[36m[SELESAI]\x1b[0m\n');
}

main().catch((err) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', err);
  process.exit(1);
});
