/**
 * Standalone One-time Migration Script:
 * Seed Google Sheets Joki AFK Roblox data into Firestore.
 * 
 * All history data are seeded as Lunas (finished: true, paymentStatus: 'Lunas').
 * 
 * Run from project root:
 *   node src/scripts/migrateJokiGsheets.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// ── Init Firebase Admin ──
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ── 6 Active Orders ──
const ACTIVE_ORDERS = [
  {
    username: 'Ozann11223344',
    tiktokName: 'my idol plado',
    service: 'Basic',
    remainingMinutes: 60,
    duration: 1,
    price: 4000,
  },
  {
    username: 'Zzeeaaa80',
    tiktokName: 'RISKI.GG',
    service: 'Basic (AFK3)',
    remainingMinutes: 13,
    duration: 0.22,
    price: 1000,
  },
  {
    username: 'inception526',
    tiktokName: 'supernoob',
    service: 'VIP',
    remainingMinutes: 50,
    duration: 0.83,
    price: 5000,
  },
  {
    username: 'renfir50',
    tiktokName: 'someone',
    service: 'Basic (AFK5)',
    remainingMinutes: 25,
    duration: 0.42,
    price: 2000,
  },
  {
    username: 'tom97737',
    tiktokName: 'v444nz2',
    service: 'Basic (AFK6)',
    remainingMinutes: 35,
    duration: 0.58,
    price: 2500,
  },
  {
    username: 'kitiaxi',
    tiktokName: 'japz_10',
    service: 'Basic',
    remainingMinutes: 60,
    duration: 1,
    price: 4000,
  },
];

// ── 21 Completed (DONE) Orders ──
const DONE_ORDERS = [
  { username: 'Ropzjiee', tiktokName: 'Ropzjiee', service: 'VIP', duration: 3.5, price: 21000 },
  { username: 'sadat', tiktokName: 'sadat', service: 'Basic (AFK)', duration: 0.75, price: 3000 },
  { username: 'zenxy', tiktokName: 'zenxy', service: 'Basic (AFK)', duration: 0.25, price: 1000 },
  { username: 'faiz drt racing', tiktokName: 'faiz drt racing', service: 'Basic (AFK)', duration: 0.5, price: 2000 },
  { username: 'goldenbrown', tiktokName: 'goldenbrown', service: 'Basic (AFK1)', duration: 2.25, price: 9000 },
  { username: 'REYYYY14352', tiktokName: 'REYYYY14352', service: 'Basic (AFK3)', duration: 1.25, price: 5000 },
  { username: 'stockdell1', tiktokName: 'falzz', service: 'Basic (AFK4)', duration: 3.25, price: 13000 },
  { username: 'brayen_1276', tiktokName: 'kevin', service: 'Basic (AFK5)', duration: 1.25, price: 5000 },
  { username: 'kamad1327', tiktokName: 'XEMTzy', service: 'Basic (AFK2)', duration: 2.0, price: 8000 },
  { username: 'Kamu_siap097', tiktokName: 'Kamu_siap097', service: 'Basic (AFK3)', duration: 2.0, price: 8000 },
  { username: 'orang_hatimu', tiktokName: 'orang_hatimu', service: 'Basic (AFK6)', duration: 1.0, price: 4000 },
  { username: 'Rizky_Rz02', tiktokName: 'Rizky_Rz02', service: 'Basic (AFK2)', duration: 0.5, price: 2000 },
  { username: 'goldenbrown', tiktokName: 'goldenbrown', service: 'Basic (AFK3)', duration: 0.75, price: 3000 },
  { username: 'nelson', tiktokName: 'nelson', service: 'VIP', duration: 1.0, price: 6000 },
  { username: 'sadat', tiktokName: 'sadat', service: 'Basic (AFK1)', duration: 0.75, price: 3000 },
  { username: 'Dapz', tiktokName: 'Dapz', service: 'Basic (AFK4)', duration: 1.0, price: 4000 },
  { username: 'BULEPALZU22', tiktokName: 'BULEPALZU22', service: 'Basic (AFK1)', duration: 1.0, price: 4000 },
  { username: 'tsubasaOzora451', tiktokName: 'tsubasaOzora451', service: 'VIP', duration: 2.0, price: 12000 },
  { username: 'hwshu', tiktokName: 'hwshu', service: 'Basic (AFK2)', duration: 2.0, price: 8000 },
  { username: 'stioklyuzlou881', tiktokName: 'stioklyuzlou881', service: 'Basic (AFK4)', duration: 1.0, price: 4000 },
  { username: 'inception526', tiktokName: 'inception526', service: 'Basic (AFK1)', duration: 1.0, price: 4000 },
];

async function runMigration() {
  console.log('🚀 Starting Joki GSheets Migration...\n');
  const now = Date.now();
  const customersCol = db.collection('joki_customers');

  // 1. Seed Global Settings
  const settingsDoc = db.doc('joki_settings/global');
  await settingsDoc.set({
    globalPaused: false,
    globalPauseStarted: null,
    updatedAt: now,
  }, { merge: true });
  console.log('✅ Initialized joki_settings/global');

  // 2. Seed 6 Active Orders
  console.log('\n📥 Seeding 6 Active Orders:');
  for (const active of ACTIVE_ORDERS) {
    const durationSeconds = active.remainingMinutes * 60;
    const docRef = customersCol.doc();
    await docRef.set({
      username: active.username,
      tiktokName: active.tiktokName,
      name: active.username,
      service: active.service,
      duration: active.duration,
      price: active.price,
      paymentStatus: 'Lunas',
      startTime: now,
      endTime: now + durationSeconds * 1000,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: false,
      stopped: false,
      stopTime: null,
      finishedTime: null,
      createdAt: now,
    });
    console.log(`  + [ACTIVE] ${active.username} (@${active.tiktokName}) - Sisa ${active.remainingMinutes} mnt`);
  }

  // 3. Seed 21 Completed Orders
  console.log('\n📥 Seeding 21 Completed (History) Orders:');
  for (let i = 0; i < DONE_ORDERS.length; i++) {
    const item = DONE_ORDERS[i];
    const offsetMs = (DONE_ORDERS.length - i) * 15 * 60 * 1000;
    const itemStartTime = now - offsetMs - item.duration * 3600 * 1000;
    const itemFinishedTime = now - offsetMs;

    const docRef = customersCol.doc();
    await docRef.set({
      username: item.username,
      tiktokName: item.tiktokName,
      name: item.username,
      service: item.service,
      duration: item.duration,
      price: item.price,
      paymentStatus: 'Lunas',
      startTime: itemStartTime,
      endTime: itemFinishedTime,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: true,
      stopped: false,
      stopTime: null,
      finishedTime: itemFinishedTime,
      createdAt: itemStartTime,
    });
    console.log(`  + [DONE] ${item.username} - Rp ${item.price.toLocaleString('id-ID')} (Lunas)`);
  }

  console.log(`\n🎉 Migration finished successfully! Total seeded: ${ACTIVE_ORDERS.length + DONE_ORDERS.length} records.`);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
