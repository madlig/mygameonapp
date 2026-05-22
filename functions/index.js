// Impor modul-modul yang diperlukan
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// FIX: Import Algolia v5 yang benar (destructured, bukan .default)
const { algoliasearch } = require("algoliasearch");

// Inisialisasi Firebase Admin SDK
admin.initializeApp();

// Definisikan parameter lingkungan
const ALGOLIA_APP_ID = defineString("ALGOLIA_APP_ID");
const ALGOLIA_API_KEY = defineString("ALGOLIA_API_KEY");
const ALGOLIA_INDEX_NAME = defineString("ALGOLIA_INDEX_NAME");

/**
 * CLOUD FUNCTION #1: onGameCreated
 * Dipicu setiap kali ada DOKUMEN BARU di koleksi 'games'.
 */
exports.onGameCreated = onDocumentCreated("games/{gameId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("Tidak ada data pada event onGameCreated, keluar.");
    return;
  }

  const newGameData = snapshot.data();
  const gameId = event.params.gameId;

  // FIX: Inisialisasi client di dalam fungsi, gunakan API v5 (tanpa initIndex)
  const algoliaClient = algoliasearch(
    ALGOLIA_APP_ID.value(),
    ALGOLIA_API_KEY.value()
  );

  logger.info("Mengindeks game baru ke Algolia:", gameId);

  const record = { objectID: gameId, ...newGameData };

  try {
    // FIX: saveObjects (v5) menggantikan index.saveObject (v4)
    await algoliaClient.saveObjects({
      indexName: ALGOLIA_INDEX_NAME.value(),
      objects: [record],
    });
    logger.info("Sukses mengindeks:", gameId);
  } catch (error) {
    logger.error("Error saat mengindeks ke Algolia:", error);
  }
});

/**
 * CLOUD FUNCTION #2: onGameUpdated
 * Dipicu setiap kali dokumen di 'games' di-update.
 */
exports.onGameUpdated = onDocumentUpdated("games/{gameId}", async (event) => {
  const change = event.data;
  if (!change || !change.after) {
    logger.log("Tidak ada data pada event onGameUpdated, keluar.");
    return;
  }

  const updatedGameData = change.after.data();
  const gameId = event.params.gameId;

  const algoliaClient = algoliasearch(
    ALGOLIA_APP_ID.value(),
    ALGOLIA_API_KEY.value()
  );

  logger.info("Memperbarui indeks game di Algolia:", gameId);

  const record = { objectID: gameId, ...updatedGameData };

  try {
    // FIX: saveObjects (v5) menggantikan index.saveObject (v4)
    await algoliaClient.saveObjects({
      indexName: ALGOLIA_INDEX_NAME.value(),
      objects: [record],
    });
    logger.info("Sukses memperbarui indeks:", gameId);
  } catch (error) {
    logger.error("Error saat memperbarui indeks di Algolia:", error);
  }
});

/**
 * CLOUD FUNCTION #3: onGameDeleted
 * Dipicu setiap kali sebuah dokumen dihapus dari 'games'.
 */
exports.onGameDeleted = onDocumentDeleted("games/{gameId}", async (event) => {
  const gameId = event.params.gameId;

  const algoliaClient = algoliasearch(
    ALGOLIA_APP_ID.value(),
    ALGOLIA_API_KEY.value()
  );

  logger.info("Menghapus indeks game dari Algolia:", gameId);

  try {
    // FIX: deleteObject (v5) menggunakan objek {indexName, objectID}
    await algoliaClient.deleteObject({
      indexName: ALGOLIA_INDEX_NAME.value(),
      objectID: gameId,
    });
    logger.info("Sukses menghapus indeks:", gameId);
  } catch (error) {
    logger.error("Error saat menghapus indeks dari Algolia:", error);
  }
});