/**
 * Multi-Tenant Workspace Initializer Script:
 * Sets up subcollections under joki_workspaces:
 * - joki_workspaces/mygameon (MyGameON AFK - your workspace)
 * - joki_workspaces/kadal (Kadal Gaming - your friend's workspace)
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

async function setupWorkspaces() {
  console.log('🚀 Initializing Multi-Tenant Joki Workspaces in Firestore...\n');
  const now = Date.now();

  // ── 1. Create Workspace: mygameon ──
  const mygameonRef = db.doc('joki_workspaces/mygameon');
  await mygameonRef.set({
    id: 'mygameon',
    name: 'MyGameON AFK',
    slug: 'mygameon',
    ownerEmail: 'admin@mygameon.store',
    createdAt: now,
  }, { merge: true });
  console.log('✅ Created workspace: joki_workspaces/mygameon');

  // Initialize mygameon settings
  await db.doc('joki_workspaces/mygameon/settings/global').set({
    globalPaused: false,
    globalPauseStarted: null,
    updatedAt: now,
  }, { merge: true });
  console.log('✅ Initialized settings: joki_workspaces/mygameon/settings/global');

  // Migrate existing joki_customers into joki_workspaces/mygameon/customers
  const rootCustomers = await db.collection('joki_customers').get();
  console.log(`\n📦 Migrating ${rootCustomers.size} customers into joki_workspaces/mygameon/customers:`);

  let migratedCount = 0;
  for (const customerDoc of rootCustomers.docs) {
    const data = customerDoc.data();
    await db.doc(`joki_workspaces/mygameon/customers/${customerDoc.id}`).set({
      ...data,
      workspaceId: 'mygameon',
    });
    migratedCount++;
  }
  console.log(`✅ Migrated ${migratedCount} customers to mygameon subcollection.`);

  // ── 2. Create Workspace: kadal (Friend's workspace) ──
  const kadalRef = db.doc('joki_workspaces/kadal');
  await kadalRef.set({
    id: 'kadal',
    name: 'Kadal Gaming',
    slug: 'kadal',
    ownerEmail: 'kadal@gmail.com',
    createdAt: now,
  }, { merge: true });
  console.log('\n✅ Created workspace: joki_workspaces/kadal');

  // Initialize kadal settings
  await db.doc('joki_workspaces/kadal/settings/global').set({
    globalPaused: false,
    globalPauseStarted: null,
    updatedAt: now,
  }, { merge: true });
  console.log('✅ Initialized settings: joki_workspaces/kadal/settings/global');

  console.log('\n🎉 Multi-Tenant subcollections successfully setup in Firestore!');
  process.exit(0);
}

setupWorkspaces().catch((err) => {
  console.error('❌ Failed to setup workspaces:', err);
  process.exit(1);
});
