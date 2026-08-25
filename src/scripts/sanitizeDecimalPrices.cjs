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

async function sanitizeDecimalPrices() {
  console.log('Sanitizing decimal prices across all workspaces...');
  
  const workspacesSnap = await db.collection('joki_workspaces').get();
  console.log(`Found ${workspacesSnap.size} workspaces to scan.`);

  let totalUpdated = 0;

  for (const wsDoc of workspacesSnap.docs) {
    const wsId = wsDoc.id;
    const customersSnap = await db.collection(`joki_workspaces/${wsId}/customers`).get();
    
    for (const custDoc of customersSnap.docs) {
      const data = custDoc.data();
      const rawPrice = data.price;
      const rawDuration = data.duration;

      let needsUpdate = false;
      const updates = {};

      if (typeof rawPrice === 'number' && !Number.isInteger(rawPrice)) {
        updates.price = Math.round(rawPrice);
        needsUpdate = true;
      }

      if (typeof rawDuration === 'number') {
        const roundedDur = Number(rawDuration.toFixed(2));
        if (roundedDur !== rawDuration) {
          updates.duration = roundedDur;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await custDoc.ref.update(updates);
        console.log(`  [${wsId}] Sanitized ${data.username || data.name} (${custDoc.id}): Price ${rawPrice} -> ${updates.price || rawPrice}`);
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 Completed! Sanitized ${totalUpdated} customer records.`);
  process.exit(0);
}

sanitizeDecimalPrices().catch(err => {
  console.error('Error during sanitization:', err);
  process.exit(1);
});
