const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function listUsers() {
  const auth = admin.auth();
  const list = await auth.listUsers(100);
  console.log(`Total users in Firebase Auth: ${list.users.length}`);
  list.users.forEach(u => {
    console.log(`- Email: ${u.email} | UID: ${u.uid} | Claims: ${JSON.stringify(u.customClaims || {})}`);
  });
}

listUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
