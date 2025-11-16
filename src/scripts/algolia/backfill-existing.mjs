import 'dotenv/config';
import { algoliasearch }  from 'algoliasearch';
import { normalizeTags } from './normalize-tags.mjs';

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME = 'games',
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY.');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

async function fetchAllHits(indexName) {
  const all = [];
  let page = 0;
  let nbPages = 1;

  do {
    const res = await client.searchSingleIndex({
      indexName,
      query: '',
      params: {
        hitsPerPage: 1000,
        page,
        attributesToRetrieve: [
          'objectID',
          'name',
          'genre',
          'tags',
          'isPopular',
          'popularityScore',
          // tidak menyentuh version/updatedAt di backfill
        ],
      },
    });
    nbPages = res.nbPages ?? 1;
    if (Array.isArray(res.hits)) all.push(...res.hits);
    page += 1;
  } while (page < nbPages);

  return all;
}

async function run() {
  console.log('Starting backfill on index:', ALGOLIA_INDEX_NAME);
  const hits = await fetchAllHits(ALGOLIA_INDEX_NAME);
  console.log(`Collected ${hits.length} records. Preparing partial updates...`);

  if (!hits.length) {
    console.log('Nothing to update.');
    return;
  }

  const updates = hits.map((h) => {
    const tags = normalizeTags(h.tags, h.genre, h.name);
    return {
      objectID: h.objectID,
      isPopular: typeof h.isPopular === 'boolean' ? h.isPopular : false,
      popularityScore: typeof h.popularityScore === 'number' ? h.popularityScore : 0,
      tags,
    };
  });

  const chunkSize = 1000;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await client.partialUpdateObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: chunk,
      createIfNotExists: false,
    });
    console.log(`Updated ${i + chunk.length}/${updates.length}`);
  }

  console.log('Backfill done ✅');
}

run().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});