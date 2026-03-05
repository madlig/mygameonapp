// src/scripts/cleanupGames.cjs
const admin = require('firebase-admin');

// --- KONFIGURASI ---
// Pastikan file service account ada di folder ini
const serviceAccount = require('./serviceAccountKey.json');
const collectionName = 'games';
const BATCH_LIMIT = 400;
// -------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const normalizeInstallerType = (value) => {
  if (!value) return 'PRE-INSTALLED';
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (upper === 'PRE INSTALLED' || upper === 'PRE-INSTALLED') {
    return 'PRE-INSTALLED';
  }
  if (upper === 'INSTALLER GOG') return 'INSTALLER GOG';
  if (upper === 'INSTALLER ELAMIGOS') return 'INSTALLER ELAMIGOS';
  return 'PRE-INSTALLED';
};

const normalizeTags = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
};

const getFirstLocation = (locations) => {
  if (!Array.isArray(locations)) return '';
  return locations.find((loc) => typeof loc === 'string' && loc.trim()) || '';
};

const cleanupGames = async () => {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log('[INFO] Collection games kosong. Tidak ada yang dibersihkan.');
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalBatches = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    const title = data.title || data.name;
    if (title && data.title !== title) updates.title = title;

    const location =
      typeof data.location === 'string' && data.location.trim()
        ? data.location
        : getFirstLocation(data.locations);
    if (location && data.location !== location) updates.location = location;

    const sizeUnit = data.sizeUnit || data.unit || 'GB';
    if (!data.sizeUnit && sizeUnit) updates.sizeUnit = sizeUnit;

    const numberOfParts =
      Number(data.numberOfParts ?? data.jumlahPart ?? 1) || 1;
    if (!data.numberOfParts || data.numberOfParts !== numberOfParts) {
      updates.numberOfParts = numberOfParts;
    }

    const createdAt = data.createdAt || data.dateAdded;
    if (!data.createdAt && createdAt) updates.createdAt = createdAt;
    if (!data.createdAt && !createdAt)
      updates.createdAt = FieldValue.serverTimestamp();

    const lastVersionDate =
      data.lastVersionDate || data.dateAdded || data.createdAt;
    if (!data.lastVersionDate && lastVersionDate) {
      updates.lastVersionDate = lastVersionDate;
    }

    if (!data.platform) updates.platform = 'PC';

    const installerType = normalizeInstallerType(data.installerType);
    if (data.installerType !== installerType)
      updates.installerType = installerType;

    if (!data.coverArtUrl && data.coverUrl) {
      updates.coverArtUrl = data.coverUrl;
    }

    if (
      data.tags === undefined ||
      data.tags === null ||
      !Array.isArray(data.tags)
    ) {
      updates.tags = normalizeTags(data.tags);
    }

    if (!data.updatedAt) {
      updates.updatedAt = FieldValue.serverTimestamp();
    }

    const deleteFields = [
      'name',
      'locations',
      'unit',
      'jumlahPart',
      'dateAdded',
      'coverUrl',
      'title_lower',
      'sortableSize',
    ];

    deleteFields.forEach((field) => {
      if (data[field] !== undefined) updates[field] = FieldValue.delete();
    });

    if (!title) {
      console.warn(`[WARN] Dokumen ${doc.id} tidak punya title/name.`);
    }

    if (Object.keys(updates).length === 0) {
      totalSkipped += 1;
      continue;
    }

    batch.update(doc.ref, updates);
    batchCount += 1;
    totalUpdated += 1;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      totalBatches += 1;
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    totalBatches += 1;
  }

  console.log('[DONE] Cleanup selesai.');
  console.log(`- Total dokumen: ${snapshot.size}`);
  console.log(`- Updated: ${totalUpdated}`);
  console.log(`- Skipped: ${totalSkipped}`);
  console.log(`- Batch commit: ${totalBatches}`);
};

cleanupGames().catch((error) => {
  console.error('[ERROR] Cleanup gagal:', error);
  process.exit(1);
});
