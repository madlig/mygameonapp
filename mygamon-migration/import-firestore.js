/**
 * MyGameON Hub — Final Firestore Import Script
 * 
 * Reads import-data.json (554 games already transformed and reviewed)
 * and writes to:
 *   - games/{auto-id}      (public data)
 *   - gamesPrivate/{same-id} (admin-only data)
 * 
 * Usage:
 *   1. Pastikan files di folder yang sama:
 *      - serviceAccountKey.json
 *      - import-data.json
 *      - import-firestore.js (this file)
 *   
 *   2. Dry run preview:
 *      node import-firestore.js --dry-run
 *   
 *   3. Execute beneran:
 *      node import-firestore.js --execute
 *   
 *   4. Optional flags:
 *      --verbose    : detail logging per game
 *      --start <n>  : start dari game ke-n (untuk resume kalau interrupt)
 *      --limit <n>  : import hanya n game (untuk testing dengan sample kecil)
 * 
 * Author: MyGameON Hub
 * Date: 27 April 2026
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================
// SETUP
// ============================================================

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Parse args
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const VERBOSE = args.includes('--verbose');

const startFlag = args.indexOf('--start');
const START_INDEX = startFlag !== -1 ? parseInt(args[startFlag + 1]) : 0;

const limitFlag = args.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(args[limitFlag + 1]) : null;

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

function parseISODateOrNull(str) {
  if (!str || str === 'None' || str === 'null') return null;
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return admin.firestore.Timestamp.fromDate(d);
  } catch (e) {
    return null;
  }
}

function transformDateField(value) {
  if (value === null || value === undefined || value === 'None') return null;
  if (typeof value === 'string') return parseISODateOrNull(value);
  return value;
}

/**
 * Convert game object from JSON (with _private and _meta) to:
 * - publicDoc: for games/{id}
 * - privateDoc: for gamesPrivate/{id}
 */
function buildDocuments(game) {
  // Convert date fields from ISO strings to Firestore Timestamps
  const lastFileUpdatedAt = transformDateField(game.lastFileUpdatedAt) 
                          || admin.firestore.FieldValue.serverTimestamp();
  
  const publicDoc = {
    // Identity
    title: game.title,
    slug: game.slug,
    
    // Classification
    genres: game.genres || [],
    tags: game.tags || [],
    platform: game.platform || 'PC',
    
    // File Info
    fileVersion: game.fileVersion || '',
    fileEdition: game.fileEdition || null,
    fileSizeBytes: game.fileSizeBytes || 0,
    partsCount: game.partsCount || 1,
    packageType: game.packageType || 'PRE-INSTALLED',
    
    // Gameplay
    playModes: game.playModes || ['singleplayer'],
    
    // Media
    coverImageUrl: game.coverImageUrl || '',
    screenshots: game.screenshots || [],
    videoUrl: game.videoUrl || null,
    
    // Descriptive
    description: game.description || '',
    shortDescription: game.shortDescription || '',
    
    // Dual-link
    shopee: {
      isAvailable: game.shopee?.isAvailable || false,
      url: game.shopee?.url || '',
      packagePrice: game.shopee?.packagePrice || null
    },
    officialPlatforms: game.officialPlatforms || [],
    
    // Steam
    steamAppId: game.steamAppId || null,
    
    // Related
    relatedGameIds: game.relatedGameIds || [],
    relatedGamesMode: game.relatedGamesMode || 'auto',
    
    // Status
    availabilityStatus: game.availabilityStatus || 'available',
    isProblematic: game.isProblematic || false,
    
    // Version Tracking
    lastFileUpdatedAt: lastFileUpdatedAt,
    lastVersionCheckAt: null,
    steamLastUpdatedAt: null,
    versionStatus: game.versionStatus || 'unchecked',
    
    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Private document
  const priv = game._private || {};
  
  // Convert storageLocations dates
  const storageLocations = (priv.storageLocations || []).map(loc => ({
    email: loc.email || '',
    role: loc.role || 'PRIMARY',
    version: loc.version || '',
    uploadedAt: transformDateField(loc.uploadedAt),
    shopeeListed: loc.shopeeListed || false,
    tipe: loc.tipe || '',
    notes: loc.notes || ''
  }));
  
  const privateDoc = {
    storageLocations: storageLocations,
    adminNotes: priv.adminNotes || '',
    verificationStatus: priv.verificationStatus || 'needs_check',
    lastVerifiedAt: transformDateField(priv.lastVerifiedAt),
    addedBy: priv.addedBy || 'csv-import-2026-04-27',
    coverSourceCredit: priv.coverSourceCredit || ''
  };
  
  return { publicDoc, privateDoc };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n========================================');
  console.log('MyGameON Final Import to Firestore');
  console.log('========================================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE'}`);
  if (START_INDEX > 0) console.log(`Start from: index ${START_INDEX}`);
  if (LIMIT) console.log(`Limit: ${LIMIT} games`);
  console.log('========================================\n');
  
  // Load import data
  const dataPath = path.join(__dirname, 'import-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ import-data.json tidak ditemukan!');
    console.error(`   Pastikan file ada di: ${dataPath}`);
    process.exit(1);
  }
  
  const allGames = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📄 Loaded ${allGames.length} games from import-data.json\n`);
  
  // Apply slice
  let games = allGames.slice(START_INDEX);
  if (LIMIT) games = games.slice(0, LIMIT);
  
  console.log(`📦 Will process ${games.length} games\n`);
  
  // Confirmation
  if (!DRY_RUN) {
    console.log('⚠️  WARNING: Akan menulis ke Firestore production!');
    console.log(`⚠️  Akan create ${games.length} dokumen di games/ dan ${games.length} di gamesPrivate/`);
    console.log('⚠️  Pastikan collection games/ dan gamesPrivate/ sudah kosong (Phase 0 wipe).\n');
    
    const answer = await prompt('Lanjutkan? Ketik "yes" untuk confirm: ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Dibatalkan.\n');
      process.exit(0);
    }
    console.log('');
  }
  
  // Process
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Stats
  const stats = {
    available: 0,
    unavailable: 0,
    problematic: 0,
    shopeeAvailable: 0,
    multiLocation: 0
  };
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const idx = START_INDEX + i + 1;
    
    try {
      const { publicDoc, privateDoc } = buildDocuments(game);
      
      // Update stats
      if (publicDoc.availabilityStatus === 'available') stats.available++;
      else stats.unavailable++;
      if (publicDoc.isProblematic) stats.problematic++;
      if (publicDoc.shopee.isAvailable) stats.shopeeAvailable++;
      if (privateDoc.storageLocations.length > 1) stats.multiLocation++;
      
      if (DRY_RUN) {
        if (VERBOSE) {
          console.log(`  [DRY ${idx}/${allGames.length}] ${publicDoc.title}`);
          console.log(`    slug: ${publicDoc.slug}`);
          console.log(`    genres: [${publicDoc.genres.join(', ')}]`);
          console.log(`    status: ${publicDoc.availabilityStatus}`);
          console.log(`    locations: ${privateDoc.storageLocations.length}`);
        } else {
          process.stdout.write('.');
          if ((i + 1) % 50 === 0) process.stdout.write(` ${i + 1}\n`);
        }
      } else {
        // Create new doc with auto-id
        const docRef = db.collection('games').doc();
        const id = docRef.id;
        
        await docRef.set(publicDoc);
        await db.collection('gamesPrivate').doc(id).set(privateDoc);
        
        if (VERBOSE) {
          console.log(`  ✓ [${idx}/${allGames.length}] ${publicDoc.title} (${id})`);
        } else {
          process.stdout.write('.');
          if ((i + 1) % 50 === 0) process.stdout.write(` ${i + 1}\n`);
        }
      }
      
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ index: idx, title: game.title, error: err.message });
      if (!VERBOSE) process.stdout.write('X');
      else console.error(`  ❌ [${idx}] ${game.title}: ${err.message}`);
    }
  }
  
  console.log('\n');
  
  // Summary
  console.log('========================================');
  console.log('Import Summary');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Errors:  ${errorCount}`);
  console.log('');
  console.log('Distribution:');
  console.log(`  Available (publik):    ${stats.available}`);
  console.log(`  Unavailable (admin):   ${stats.unavailable}`);
  console.log(`  Marked problematic:    ${stats.problematic}`);
  console.log(`  Shopee available:      ${stats.shopeeAvailable}`);
  console.log(`  Multi-location:        ${stats.multiLocation}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => {
      console.log(`  [${e.index}] ${e.title}: ${e.error}`);
    });
    
    // Save error log
    const errorLog = path.join(__dirname, 'import-errors.json');
    fs.writeFileSync(errorLog, JSON.stringify(errors, null, 2));
    console.log(`\n   Error details saved to: ${errorLog}`);
  }
  
  console.log('\n========================================');
  if (DRY_RUN) {
    console.log('✅ DRY RUN completed — no data written');
    console.log('Run with --execute to apply changes');
  } else {
    console.log('✅ Import completed!');
    console.log('\nNext steps:');
    console.log('1. Verify di Firebase Console:');
    console.log('   - games/ should have 554 documents');
    console.log('   - gamesPrivate/ should have 554 documents');
    console.log('2. Test public access (incognito): bisa lihat games?');
    console.log('3. Test admin access: bisa lihat gamesPrivate?');
    console.log('4. Phase 0 COMPLETE 🎉');
  }
  console.log('========================================\n');
  
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n❌ Script failed:', err);
  process.exit(1);
});
