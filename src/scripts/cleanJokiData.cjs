/**
 * One-time Data Sanitization Script:
 * Cleans all joki_customers documents so that:
 * - service is strictly 'Basic' or 'VIP'
 * - slot is strictly '1', '2', '3', '4', '5', '6', or 'VIP'
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function cleanData() {
  console.log('🧹 Cleaning and normalizing joki_customers data...\n');
  const snap = await db.collection('joki_customers').get();
  console.log(`Found ${snap.size} documents to inspect.`);

  let updatedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    let { service = '', slot = '' } = data;
    const originalService = service;
    const originalSlot = slot;

    let cleanService = 'Basic';
    let cleanSlot = slot;

    // Detect VIP
    if (service.toUpperCase().includes('VIP') || slot === 'VIP') {
      cleanService = 'VIP';
      cleanSlot = 'VIP';
    } else {
      // Basic detection & slot extraction
      cleanService = 'Basic';

      // Check if service string had slot info like 'Basic (AFK3)' or 'AFK4'
      const match = service.match(/AFK(\d+)/i) || (data.name && data.name.match(/AFK(\d+)/i));
      if (match && match[1]) {
        cleanSlot = match[1];
      } else if (!cleanSlot || cleanSlot === '-') {
        cleanSlot = '1';
      }
    }

    if (cleanService !== originalService || cleanSlot !== originalSlot) {
      await doc.ref.update({
        service: cleanService,
        slot: cleanSlot,
      });
      console.log(`  ✓ Updated doc ${doc.id} (${data.username || data.name}): Service: "${originalService}" -> "${cleanService}", Slot: "${originalSlot}" -> "${cleanSlot}"`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Data cleanup complete! Total updated: ${updatedCount} docs.`);
  process.exit(0);
}

cleanData().catch((err) => {
  console.error('❌ Data cleanup failed:', err);
  process.exit(1);
});
