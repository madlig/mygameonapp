import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { algoliasearch } from 'algoliasearch';
import admin from 'firebase-admin';

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME = 'games',
  ALGOLIA_CLEAR_INDEX = 'false',
  GOOGLE_APPLICATION_CREDENTIALS,
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackServiceAccountPath = path.resolve(
  __dirname,
  '../serviceAccountKey.json'
);

const initFirebase = () => {
  if (admin.apps.length) return;

  if (GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return;
  }

  if (!fs.existsSync(fallbackServiceAccountPath)) {
    console.error('Missing Firebase credentials.');
    console.error(
      `Set GOOGLE_APPLICATION_CREDENTIALS or create ${fallbackServiceAccountPath}`
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(fallbackServiceAccountPath, 'utf-8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const run = async () => {
  initFirebase();

  const db = admin.firestore();
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

  console.log('[INFO] Reindex Firestore -> Algolia');
  console.log('- Index:', ALGOLIA_INDEX_NAME);
  console.log('- Clear index first:', ALGOLIA_CLEAR_INDEX);

  if (ALGOLIA_CLEAR_INDEX === 'true') {
    console.log('[INFO] Clearing Algolia index...');
    await client.clearObjects({ indexName: ALGOLIA_INDEX_NAME });
  }

  const snapshot = await db.collection('games').get();

  if (snapshot.empty) {
    console.log('[INFO] No documents found in games collection.');
    return;
  }

  const records = [];
  const missingTitle = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const title = data.title || data.name || '';
    if (!title) missingTitle.push(doc.id);

    records.push({
      objectID: doc.id,
      ...data,
    });
  });

  console.log(`[INFO] Collected ${records.length} records.`);
  if (missingTitle.length) {
    console.warn(`[WARN] ${missingTitle.length} records missing title/name.`);
  }

  const batches = chunk(records, 1000);
  let uploaded = 0;

  for (const batch of batches) {
    await client.saveObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: batch,
    });
    uploaded += batch.length;
    console.log(`[INFO] Uploaded ${uploaded}/${records.length}`);
  }

  console.log('[DONE] Algolia reindex completed.');
};

run().catch((error) => {
  console.error('[ERROR] Reindex failed:', error);
  process.exit(1);
});
