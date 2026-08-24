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
const auth = admin.auth();

async function syncAdminEmails() {
  console.log('Syncing admin emails and setting custom claims...');
  
  const workspacesSnap = await db.collection('joki_workspaces').get();
  console.log(`Found ${workspacesSnap.size} workspaces.`);

  for (const docSnap of workspacesSnap.docs) {
    const data = docSnap.data();
    if (data.ownerEmail) {
      const email = data.ownerEmail.toLowerCase();
      
      // 1. Whitelist in Firestore joki_admin_emails
      await db.collection('joki_admin_emails').doc(email).set({
        email: email,
        name: data.name || docSnap.id,
        slug: docSnap.id,
        createdAt: data.createdAt || Date.now()
      }, { merge: true });
      console.log(`✓ Whitelisted admin email in Firestore: ${email} for workspace ${docSnap.id}`);

      // 2. Also set custom user claims in Firebase Auth if user exists
      try {
        const userRecord = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(userRecord.uid, {
          admin: true,
          role: 'admin',
          workspaceId: docSnap.id
        });
        console.log(`  -> Set Firebase Auth Custom Claims { admin: true, role: 'admin' } for UID: ${userRecord.uid}`);
      } catch (err) {
        console.log(`  (Note: User with email ${email} not yet created in Auth: ${err.message})`);
      }
    }
  }

  // Super Admin Whitelist & Claims
  const superAdminEmail = 'madlighifari29@gmail.com';
  await db.collection('joki_admin_emails').doc(superAdminEmail).set({
    email: superAdminEmail,
    name: 'Super Admin Madli',
    slug: 'mygameon',
    createdAt: Date.now()
  }, { merge: true });

  try {
    const superUser = await auth.getUserByEmail(superAdminEmail);
    await auth.setCustomUserClaims(superUser.uid, {
      admin: true,
      role: 'admin',
      workspaceId: 'mygameon'
    });
    console.log(`✓ Super Admin claims verified for ${superAdminEmail}`);
  } catch (err) {
    console.log(`Note for Super Admin: ${err.message}`);
  }

  console.log('\n🎉 Sync & Claims setup completed successfully!');
  process.exit(0);
}

syncAdminEmails().catch((err) => {
  console.error('Error syncing admin emails:', err);
  process.exit(1);
});
