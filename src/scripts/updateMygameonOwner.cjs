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

async function updateWorkspaceOwner() {
  await db.doc('joki_workspaces/mygameon').set({
    id: 'mygameon',
    name: 'MyGameON AFK',
    slug: 'mygameon',
    ownerEmail: 'madlighifari29@gmail.com',
    ownerUid: 'UB4dCk7PaefoGjJpHJo62aUUNin2',
    createdAt: Date.now()
  }, { merge: true });
  console.log('✅ Updated joki_workspaces/mygameon with ownerEmail: madlighifari29@gmail.com');
}

updateWorkspaceOwner().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
