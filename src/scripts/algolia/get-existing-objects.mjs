// Helper untuk mengambil objek existing di Algolia v5 tanpa initIndex
export async function getExistingObjects(client, indexName, objectIDs = []) {
  const map = new Map();
  if (!objectIDs.length) return map;

  // Pada client v5 tidak ada getObjects bundel lama yang langsung array of IDs,
  // jadi kita lakukan beberapa panggilan paralel getObject
  // (Bisa dioptimalkan dengan searchForHits kalau perlu).
  const workers = objectIDs.map(async (id) => {
    try {
      const obj = await client.getObject({ indexName, objectID: id });
      if (obj && obj.objectID) map.set(obj.objectID, obj);
    } catch (e) {
      // Jika objek tidak ada, abaikan
    }
  });
  await Promise.all(workers);
  return map;
}