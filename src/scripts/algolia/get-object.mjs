import 'dotenv/config';
import algoliasearch from 'algoliasearch';

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME = 'games' } = process.env;

const objectID = process.argv[2];
if (!objectID) {
  console.error('Usage: node src/scripts/algolia/get-object.mjs <objectID>');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

const obj = await client.getObject({ indexName: ALGOLIA_INDEX_NAME, objectID });
console.log(JSON.stringify(obj, null, 2));