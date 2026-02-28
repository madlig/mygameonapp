const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    uid: '',
    email: '',
    role: 'admin',
    admin: true,
    serviceAccountPath: '',
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];

    if (current === '--uid') {
      options.uid = args[i + 1] || '';
      i += 1;
      continue;
    }

    if (current === '--email') {
      options.email = args[i + 1] || '';
      i += 1;
      continue;
    }

    if (current === '--role') {
      options.role = args[i + 1] || 'admin';
      i += 1;
      continue;
    }

    if (current === '--admin') {
      const value = (args[i + 1] || 'true').toLowerCase();
      options.admin = value !== 'false';
      i += 1;
      continue;
    }

    if (current === '--service-account') {
      options.serviceAccountPath = args[i + 1] || '';
      i += 1;
      continue;
    }
  }

  return options;
}

function resolveServiceAccountPath(explicitPath) {
  if (explicitPath) {
    return path.resolve(process.cwd(), explicitPath);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return path.resolve(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
  }

  return path.resolve(process.cwd(), 'src/scripts/serviceAccountKey.json');
}

function initializeAdmin(serviceAccountPath) {
  if (admin.apps.length > 0) {
    return;
  }

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  admin.initializeApp();
}

async function resolveUserIdentifier(auth, uid, email) {
  if (uid) {
    return uid;
  }

  if (!email) {
    throw new Error('Gunakan --uid atau --email.');
  }

  const userRecord = await auth.getUserByEmail(email);
  return userRecord.uid;
}

async function main() {
  const options = parseArgs(process.argv);
  const serviceAccountPath = resolveServiceAccountPath(
    options.serviceAccountPath
  );

  initializeAdmin(serviceAccountPath);

  const auth = admin.auth();
  const uid = await resolveUserIdentifier(auth, options.uid, options.email);

  const claims = {
    admin: options.admin,
    role: options.role,
  };

  await auth.setCustomUserClaims(uid, claims);
  const user = await auth.getUser(uid);

  console.log('Admin claim berhasil di-set.');
  console.log(`UID: ${user.uid}`);
  console.log(`Email: ${user.email || '(tanpa email)'}`);
  console.log(`Claims: ${JSON.stringify(user.customClaims || {})}`);
  console.log(
    'Silakan logout lalu login ulang agar token claim terbaru terbaca di aplikasi.'
  );
}

main().catch((error) => {
  console.error('Gagal set admin claim:', error.message);
  process.exit(1);
});
