/**
 * MyGameON Hub — Phase 0 Fresh Start Script
 * 
 * Updated: 26 April 2026
 * 
 * Changes:
 * - Now wipes genres/ collection too (legacy, migrated to metadata/genres/)
 * - Sets clean { role: 'admin' } custom claim (no more legacy admin: true)
 * - Improved logging
 * 
 * Tasks:
 * 1. WIPE: games/, gamesPrivate/, genres/ (legacy)
 * 2. SEED: metadata/ collections (genres, tags, playModes, platforms)
 * 3. SET ADMIN: assign role: 'admin' custom claim
 * 
 * Usage:
 *   node phase-0-fresh-start.js --dry-run
 *   node phase-0-fresh-start.js --execute
 *   node phase-0-fresh-start.js --execute --set-admin madlighifari29@gmail.com
 *   node phase-0-fresh-start.js --execute --skip-wipe
 *   node phase-0-fresh-start.js --execute --skip-metadata
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const VERBOSE = args.includes('--verbose');
const SKIP_WIPE = args.includes('--skip-wipe');
const SKIP_METADATA = args.includes('--skip-metadata');

const setAdminFlag = args.indexOf('--set-admin');
const ADMIN_EMAIL = setAdminFlag !== -1 ? args[setAdminFlag + 1] : null;

console.log('\n========================================');
console.log('MyGameON Phase 0 — Fresh Start');
console.log('========================================');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE'}`);
console.log(`Wipe: ${SKIP_WIPE ? 'SKIP' : 'YES (games, gamesPrivate, genres)'}`);
console.log(`Seed metadata: ${SKIP_METADATA ? 'SKIP' : 'YES'}`);
if (ADMIN_EMAIL) console.log(`Set admin: ${ADMIN_EMAIL}`);
console.log('========================================\n');

// ============================================================
// HELPERS
// ============================================================

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);
  
  let totalDeleted = 0;
  
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject, count => {
      totalDeleted += count;
      if (VERBOSE) console.log(`    ...deleted ${totalDeleted} so far`);
    });
  });
}

async function deleteQueryBatch(query, resolve, reject, onProgress) {
  try {
    const snapshot = await query.get();
    
    if (snapshot.size === 0) {
      resolve();
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    onProgress(snapshot.size);
    process.nextTick(() => deleteQueryBatch(query, resolve, reject, onProgress));
  } catch (err) {
    reject(err);
  }
}

// ============================================================
// PART 1: WIPE
// ============================================================

async function wipeCollections() {
  console.log('🗑️  Part 1: Wiping collections...\n');
  
  const collectionsToWipe = [
    { name: 'games', reason: 'will be re-imported via CSV' },
    { name: 'gamesPrivate', reason: 'paired with games/' },
    { name: 'genres', reason: 'LEGACY — migrated to metadata/genres/entries/' }
  ];
  
  for (const { name, reason } of collectionsToWipe) {
    const snapshot = await db.collection(name).limit(1).get();
    
    if (snapshot.empty) {
      console.log(`  → ${name}: empty (nothing to wipe)`);
      continue;
    }
    
    const allSnapshot = await db.collection(name).get();
    console.log(`  → ${name}: ${allSnapshot.size} documents found`);
    console.log(`    Reason: ${reason}`);
    
    if (DRY_RUN) {
      console.log(`    [DRY] would delete ${allSnapshot.size} documents`);
    } else {
      console.log(`    Deleting...`);
      await deleteCollection(name);
      console.log(`    ✅ ${name} wiped`);
    }
    console.log('');
  }
}

// ============================================================
// PART 2: SEED METADATA
// ============================================================

async function seedMetadata() {
  console.log('📦 Part 2: Seeding metadata collections...\n');
  
  const seedsPath = path.join(__dirname, 'metadata-default-seeds.json');
  if (!fs.existsSync(seedsPath)) {
    console.error('❌ metadata-default-seeds.json tidak ditemukan!');
    console.error(`   Pastikan file ada di: ${seedsPath}`);
    process.exit(1);
  }
  
  const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  let totalCount = 0;
  
  for (const [type, entries] of Object.entries(seeds.metadata)) {
    console.log(`  → metadata/${type}/entries/`);
    let typeCount = 0;
    
    for (const [slug, data] of Object.entries(entries)) {
      const docRef = db
        .collection('metadata')
        .doc(type)
        .collection('entries')
        .doc(slug);
      
      const docData = {
        ...data,
        createdAt: now
      };
      
      if (DRY_RUN) {
        if (VERBOSE) console.log(`    [DRY] ${slug}: ${data.label}`);
      } else {
        await docRef.set(docData);
        if (VERBOSE) console.log(`    [WRITE] ${slug}: ${data.label}`);
      }
      
      typeCount++;
      totalCount++;
    }
    
    console.log(`    ${typeCount} entries`);
  }
  
  console.log(`\n✅ Total metadata entries: ${totalCount}\n`);
}

// ============================================================
// PART 3: SET ADMIN CLAIM (Clean Pattern)
// ============================================================

async function setAdminClaim(email) {
  console.log(`👤 Part 3: Setting admin claim for ${email}...\n`);
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // Get current claims
    const currentClaims = user.customClaims || {};
    if (VERBOSE) {
      console.log(`  Current claims:`, currentClaims);
    }
    
    // Build new claims — single source of truth: role
    const newClaims = {
      ...currentClaims,
      role: 'admin'
    };
    
    // Cleanup: remove legacy 'admin: true' if exists
    delete newClaims.admin;
    
    if (DRY_RUN) {
      console.log(`  [DRY] would set claims for UID ${user.uid}:`);
      console.log(`        ${JSON.stringify(newClaims)}\n`);
    } else {
      await admin.auth().setCustomUserClaims(user.uid, newClaims);
      console.log(`  ✅ ${email} now has role: 'admin'`);
      console.log(`  Claims:`, newClaims);
      console.log(`  ⚠️  IMPORTANT: User must logout & login again for claim to activate\n`);
    }
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`  ❌ User dengan email ${email} tidak ditemukan`);
      console.error(`     Pastikan akun sudah terdaftar di Firebase Auth\n`);
    } else {
      console.error(`  ❌ Error: ${err.message}\n`);
    }
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    // Confirmation prompt for execute mode
    if (!DRY_RUN) {
      console.log('⚠️  WARNING: Akan menjalankan operasi DESTRUCTIVE pada Firestore!');
      if (!SKIP_WIPE) {
        console.log('⚠️  Collections yang akan DIHAPUS:');
        console.log('     - games/');
        console.log('     - gamesPrivate/');
        console.log('     - genres/ (legacy, migrated to metadata/)');
      }
      console.log('⚠️  Pastikan kamu sudah backup data!\n');
      
      const answer = await prompt('Lanjutkan? Ketik "yes" untuk confirm: ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Dibatalkan.\n');
        process.exit(0);
      }
      console.log('');
    }
    
    if (!SKIP_WIPE) {
      await wipeCollections();
    } else {
      console.log('⏭️  Skipping wipe step (--skip-wipe)\n');
    }
    
    if (!SKIP_METADATA) {
      await seedMetadata();
    } else {
      console.log('⏭️  Skipping metadata seed (--skip-metadata)\n');
    }
    
    if (ADMIN_EMAIL) {
      await setAdminClaim(ADMIN_EMAIL);
    }
    
    console.log('========================================');
    console.log('✅ Phase 0 Fresh Start completed!');
    console.log('========================================');
    
    if (DRY_RUN) {
      console.log('\nThis was a DRY RUN — no data was changed.');
      console.log('Run with --execute to apply changes.\n');
    } else {
      console.log('\nNext steps:');
      console.log('1. Verify metadata di Firebase Console');
      console.log('2. Deploy security rules: firebase deploy --only firestore:rules');
      console.log('3. Logout & login ulang (untuk admin claim aktif)');
      console.log('4. Re-import 23 games via bulk-import-games.js');
      console.log('5. Lanjut ke Phase 1: Detail Page MVP\n');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  }
}

main();