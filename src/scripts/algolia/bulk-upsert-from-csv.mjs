import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import { algoliasearch } from 'algoliasearch';
import { normalizeTags } from './normalize-tags.mjs';
import { getExistingObjects } from './get-existing-objects.mjs';

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME = 'games'
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY.');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npm run algolia:csv data/games.csv');
  process.exit(1);
}
const abs = path.resolve(csvPath);
if (!fs.existsSync(abs)) {
  console.error('CSV not found:', abs);
  process.exit(1);
}

function parseDelimited(s) {
  if (!s) return [];
  return String(s)
    .split(/[|,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function run() {
  const rows = await readCsv(abs);
  console.log(`Loaded ${rows.length} rows from CSV`);

  const objectIDs = rows.map((r) => r.objectID?.trim()).filter(Boolean);
  const currentMap = await getExistingObjects(client, ALGOLIA_INDEX_NAME, objectIDs);

  const nowISO = new Date().toISOString();
  const updates = [];

  for (const row of rows) {
    const objectID = row.objectID?.trim();
    if (!objectID) continue;

    const name = row.name?.trim() || null;
    const version = row.version?.trim() || null;
    const rawTags = parseDelimited(row.tags);
    const genre = parseDelimited(row.genre);
    const tags = normalizeTags(rawTags, genre, name || '');

    const current = currentMap.get(objectID);
    const currentVersion = current?.version || null;

    const patch = { objectID };
    if (name) patch.name = name;
    if (version) patch.version = version;
    if (genre.length) patch.genre = genre;
    if (tags.length) patch.tags = tags;

    // Set updatedAt jika version berubah
    if (version && version !== currentVersion) {
      patch.updatedAt = nowISO;
    }

    updates.push(patch);
  }

  console.log(`Prepared ${updates.length} update objects`);

  if (!updates.length) {
    console.log('No objects to upsert. Done.');
    return;
  }

  const chunkSize = 1000;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await client.partialUpdateObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: chunk,
      createIfNotExists: true
    });
    console.log(`Upserted ${i + chunk.length}/${updates.length}`);
  }

  console.log('CSV upsert done ✅');
}

run().catch((e) => {
  console.error('Bulk upsert failed:', e);
  process.exit(1);
});