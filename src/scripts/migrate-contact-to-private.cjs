/**
 * Migration script: Move contactWhatsApp & shopeeUsername
 * from requests/{id} → requests/{id}/private/contact
 *
 * Run once from project root:
 *   node scripts/migrate-contact-to-private.js
 *
 * Requires: firebase-admin (npm i -D firebase-admin)
 * + a service account key file at scripts/serviceAccountKey.json
 */

const admin = require('firebase-admin');
const path = require('path');

// ── Init Firebase Admin ──
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  const requestsSnap = await db.collection('requests').get();
  console.log(`Found ${requestsSnap.size} request documents.\n`);

  let migrated = 0;
  let skipped = 0;
  let cleaned = 0;

  for (const requestDoc of requestsSnap.docs) {
    const data = requestDoc.data();
    const id = requestDoc.id;
    const contactWA = data.contactWhatsApp || '';
    const shopeeUser = data.shopeeUsername || '';

    // Skip if no sensitive data to migrate
    if (!contactWA && !shopeeUser) {
      skipped++;
      continue;
    }

    // Check if private/contact already exists
    const privateRef = db.doc(`requests/${id}/private/contact`);
    const privateSnap = await privateRef.get();

    if (!privateSnap.exists) {
      // Write to private sub-collection
      await privateRef.set({
        contactWhatsApp: contactWA,
        shopeeUsername: shopeeUser,
      });
      console.log(
        `Migrated: ${id} (WA: ${contactWA ? 'yes' : 'no'}, Shopee: ${shopeeUser ? 'yes' : 'no'})`
      );
      migrated++;
    } else {
      console.log(`Already migrated: ${id}`);
      skipped++;
    }

    // Remove sensitive fields from main document
    const updates = {};
    if ('contactWhatsApp' in data)
      updates.contactWhatsApp = admin.firestore.FieldValue.delete();
    if ('shopeeUsername' in data)
      updates.shopeeUsername = admin.firestore.FieldValue.delete();

    if (Object.keys(updates).length > 0) {
      await requestDoc.ref.update(updates);
      cleaned++;
    }
  }

  console.log(`\n-- Summary --`);
  console.log(`Total docs:  ${requestsSnap.size}`);
  console.log(`Migrated:    ${migrated}`);
  console.log(`Skipped:     ${skipped}`);
  console.log(`Cleaned:     ${cleaned} (removed fields from main doc)`);
  console.log(`\nDone! Sensitive fields moved to private sub-collection.`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
