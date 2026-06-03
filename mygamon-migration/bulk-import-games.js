/**
 * MyGameON Hub — Bulk CSV Import Script
 * 
 * Tugas: Import games dari CSV ke Firestore sesuai schema baru.
 * 
 * Cara pakai:
 *   1. Siapkan file CSV (template: games-import-template.csv)
 *   2. node bulk-import-games.js games.csv --dry-run    (preview)
 *   3. node bulk-import-games.js games.csv --execute    (jalanin)
 * 
 * CSV Format (header row required):
 *   title, genres, tags, platform, fileVersion, fileEdition,
 *   fileSizeGB, partsCount, packageType, playModes,
 *   coverImageUrl, description, shortDescription, videoUrl,
 *   shopeeAvailable, shopeeUrl, shopeePackagePrice,
 *   steamAppId, steamUrl, gogUrl, epicUrl,
 *   storageLocation, adminNotes, verificationStatus, coverSourceCredit
 * 
 * Notes:
 *   - genres, tags, playModes: comma-separated dalam satu cell, e.g. "action,shooter"
 *   - shopeeAvailable: TRUE/FALSE atau true/false
 *   - fileSizeGB: dalam GB, akan di-convert ke bytes
 *   - Field kosong = null/empty
 * 
 * Author: MyGameON Hub
 * Date: 26 April 2026
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
const csvFile = args[0];
const DRY_RUN = !args.includes('--execute');
const VERBOSE = args.includes('--verbose');

if (!csvFile || csvFile.startsWith('--')) {
  console.error('❌ Usage: node bulk-import-games.js <csv-file> [--execute] [--verbose]');
  console.error('   Example: node bulk-import-games.js games.csv --dry-run');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error(`❌ File tidak ditemukan: ${csvFile}`);
  process.exit(1);
}

console.log('\n========================================');
console.log('MyGameON Bulk CSV Import');
console.log('========================================');
console.log(`CSV: ${csvFile}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}`);
console.log('========================================\n');

// ============================================================
// CSV PARSER
// ============================================================

function parseCSV(content) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  
  // Handle multi-line quoted fields properly
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '\n' && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  
  // Parse each line into fields
  const rows = lines.map(line => {
    const fields = [];
    let field = '';
    let inQ = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQ = !inQ;
      } else if (char === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  });
  
  // First row is header
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
  
  return data;
}

// ============================================================
// HELPERS
// ============================================================

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function formatFileSize(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function generateShortDescription(title, genres, fileSizeBytes) {
  const genreText = genres.slice(0, 2).join(' & ') || 'menarik';
  const sizeText = formatFileSize(fileSizeBytes);
  return `${title} — game ${genreText} berukuran ${sizeText}. Tersedia paket instalasi siap main.`;
}

function parseList(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
}

function parseBool(str) {
  if (!str) return false;
  return ['true', 'yes', '1'].includes(str.toLowerCase());
}

function parseNumber(str) {
  if (!str) return null;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

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

// ============================================================
// BUILD GAME DOCUMENTS
// ============================================================

function buildGameDocument(row, slugMap) {
  const title = row.title?.trim();
  if (!title) {
    throw new Error('Title is required');
  }
  
  // Generate unique slug
  let slug = generateSlug(title);
  let counter = 1;
  const originalSlug = slug;
  while (slugMap.has(slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
  slugMap.set(slug, title);
  
  // Parse fields
  const genres = parseList(row.genres);
  const tags = parseList(row.tags);
  const playModes = parseList(row.playModes);
  
  // Convert size
  const fileSizeGB = parseNumber(row.fileSizeGB);
  const fileSizeBytes = fileSizeGB ? Math.round(fileSizeGB * (1024 ** 3)) : 0;
  
  // Build officialPlatforms array
  const officialPlatforms = [];
  if (row.steamUrl) {
    officialPlatforms.push({
      platform: 'steam',
      url: row.steamUrl,
      isAvailable: true
    });
  }
  if (row.gogUrl) {
    officialPlatforms.push({
      platform: 'gog',
      url: row.gogUrl,
      isAvailable: true
    });
  }
  if (row.epicUrl) {
    officialPlatforms.push({
      platform: 'epic',
      url: row.epicUrl,
      isAvailable: true
    });
  }
  
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  // Public document
  const publicDoc = {
    // Identity
    title: title,
    slug: slug,
    
    // Classification
    genres: genres,
    tags: tags,
    platform: row.platform || 'PC',
    
    // File Info
    fileVersion: row.fileVersion || '-',
    fileEdition: row.fileEdition || null,
    fileSizeBytes: fileSizeBytes,
    partsCount: parseInt(row.partsCount) || 1,
    packageType: row.packageType || 'PRE-INSTALLED',
    
    // Gameplay
    playModes: playModes.length > 0 ? playModes : ['singleplayer'],
    
    // Media
    coverImageUrl: row.coverImageUrl || '',
    screenshots: [],
    videoUrl: row.videoUrl || null,
    
    // Descriptive
    description: row.description || '',
    shortDescription: row.shortDescription || generateShortDescription(title, genres, fileSizeBytes),
    
    // Dual-link
    shopee: {
      isAvailable: parseBool(row.shopeeAvailable),
      url: row.shopeeUrl || '',
      packagePrice: parseNumber(row.shopeePackagePrice)
    },
    officialPlatforms: officialPlatforms,
    
    // Steam
    steamAppId: row.steamAppId || null,
    
    // Related
    relatedGameIds: [],
    relatedGamesMode: 'auto',
    
    // Status
    availabilityStatus: 'available',
    isProblematic: false,
    
    // Version Tracking
    lastFileUpdatedAt: now,
    lastVersionCheckAt: null,
    steamLastUpdatedAt: null,
    versionStatus: 'unchecked',
    
    // Timestamps
    createdAt: now,
    updatedAt: now
  };
  
  // Private document
  const privateDoc = {
    storageLocation: row.storageLocation || '',
    adminNotes: row.adminNotes || '',
    verificationStatus: row.verificationStatus || 'needs_check',
    lastVerifiedAt: row.verificationStatus === 'verified' ? now : null,
    addedBy: 'bulk-csv-import',
    coverSourceCredit: row.coverSourceCredit || ''
  };
  
  return { publicDoc, privateDoc, slug };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    // Read & parse CSV
    const content = fs.readFileSync(csvFile, 'utf8');
    const rows = parseCSV(content);
    
    console.log(`📄 Loaded ${rows.length} rows from CSV\n`);
    
    if (rows.length === 0) {
      console.error('❌ CSV kosong atau format tidak valid');
      process.exit(1);
    }
    
    // Build documents
    const slugMap = new Map();
    const documents = [];
    
    for (const [index, row] of rows.entries()) {
      try {
        const doc = buildGameDocument(row, slugMap);
        documents.push(doc);
        
        console.log(`  ${index + 1}. ${doc.publicDoc.title}`);
        console.log(`     slug: ${doc.slug}`);
        console.log(`     genres: [${doc.publicDoc.genres.join(', ')}]`);
        console.log(`     size: ${formatFileSize(doc.publicDoc.fileSizeBytes)}`);
        console.log(`     playModes: [${doc.publicDoc.playModes.join(', ')}]`);
        console.log(`     official: ${doc.publicDoc.officialPlatforms.length} platform(s)`);
        console.log('');
      } catch (err) {
        console.error(`  ❌ Row ${index + 1}: ${err.message}`);
      }
    }
    
    // Confirm before write
    if (!DRY_RUN) {
      console.log(`⚠️  Akan menulis ${documents.length} games ke Firestore.`);
      const answer = await prompt('Lanjutkan? Ketik "yes": ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Dibatalkan.\n');
        process.exit(0);
      }
      console.log('');
    }
    
    // Write to Firestore
    if (DRY_RUN) {
      console.log(`✅ DRY RUN: ${documents.length} games siap di-import\n`);
      console.log('Run dengan --execute untuk menulis ke Firestore.\n');
    } else {
      console.log(`📝 Writing ${documents.length} games to Firestore...\n`);
      
      let written = 0;
      for (const { publicDoc, privateDoc } of documents) {
        const docRef = db.collection('games').doc();
        const id = docRef.id;
        
        await docRef.set(publicDoc);
        await db.collection('gamesPrivate').doc(id).set(privateDoc);
        
        written++;
        if (VERBOSE) {
          console.log(`  ✓ ${publicDoc.title} (${id})`);
        }
      }
      
      console.log(`\n✅ Successfully imported ${written} games\n`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  }
}

main();
