import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME = 'games'
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY env vars.');
  process.exit(1);
}

console.log('Algolia Diagnose');
console.log('- App ID        :', ALGOLIA_APP_ID);
console.log('- Index Name    :', ALGOLIA_INDEX_NAME);

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

try {
  const { items } = await client.listIndices();
  const names = items?.map((i) => `${i.indexName} (entries=${i.entries})`) || [];
  console.log('- Indices found :', names.length);
  console.log(names.slice(0, 20).join('\n'));

  // Check the target index
  const res = await client.searchSingleIndex({
    indexName: ALGOLIA_INDEX_NAME,
    query: '',
    params: { hitsPerPage: 5, page: 0 }
  });
  console.log(`- Target "${ALGOLIA_INDEX_NAME}" nbHits:`, res.nbHits);
  if (res.hits?.length) {
    console.log('- Sample objectIDs:', res.hits.map((h) => h.objectID).join(', '));
  } else {
    console.log('- No hits returned from target index.');
  }
} catch (e) {
  console.error('Diagnose failed:', e);
  process.exit(1);
}