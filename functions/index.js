// Impor modul-modul yang diperlukan
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// PERUBAHAN #1: Cara Impor Algolia yang benar untuk versi baru
const algoliasearch = require("algoliasearch").default;

// Inisialisasi Firebase Admin SDK
admin.initializeApp();

// Definisikan parameter lingkungan (environment parameters) yang akan dibaca dari file .env
const ALGOLIA_APP_ID = defineString("ALGOLIA_APP_ID");
const ALGOLIA_API_KEY = defineString("ALGOLIA_API_KEY");
const ALGOLIA_INDEX_NAME = defineString("ALGOLIA_INDEX_NAME");

// PERUBAHAN #2: Hapus inisialisasi klien dari global scope untuk menghindari error saat deploy.
// Inisialisasi akan dilakukan di dalam setiap fungsi.

/**
 * CLOUD FUNCTION #1: onGameCreated (menggunakan sintaks v2)
 * Dipicu setiap kali ada DOKUMEN BARU yang dibuat di koleksi 'games'.
 */
exports.onGameCreated = onDocumentCreated("games/{gameId}", async (event) => {
  // Inisialisasi klien dipindahkan ke DALAM fungsi
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_API_KEY.value());
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME.value());

  const snapshot = event.data;
  if (!snapshot) {
    logger.log("Tidak ada data pada event onGameCreated, keluar.");
    return;
  }
  const newGameData = snapshot.data();
  const gameId = event.params.gameId;

  logger.info("Mengindeks game baru ke Algolia:", gameId);
  const record = { objectID: gameId, ...newGameData };

  try {
    await index.saveObject(record);
    logger.info("Sukses mengindeks:", gameId);
  } catch (error) {
    logger.error("Error saat mengindeks ke Algolia:", error);
  }
});

/**
 * CLOUD FUNCTION #2: onGameUpdated (menggunakan sintaks v2)
 * Dipicu setiap kali dokumen yang ADA di koleksi 'games' di-update.
 */
exports.onGameUpdated = onDocumentUpdated("games/{gameId}", async (event) => {
  // Inisialisasi klien dipindahkan ke DALAM fungsi
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_API_KEY.value());
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME.value());

  const change = event.data;
  if (!change || !change.after) {
    logger.log("Tidak ada data pada event onGameUpdated, keluar.");
    return;
  }
  const updatedGameData = change.after.data();
  const gameId = event.params.gameId;

  logger.info("Memperbarui indeks game di Algolia:", gameId);
  const record = { objectID: gameId, ...updatedGameData };

  try {
    await index.saveObject(record);
    logger.info("Sukses memperbarui indeks:", gameId);
  } catch (error) {
    logger.error("Error saat memperbarui indeks di Algolia:", error);
  }
});

/**
 * CLOUD FUNCTION #3: onGameDeleted (menggunakan sintaks v2)
 * Dipicu setiap kali sebuah dokumen dihapus dari koleksi 'games'.
 */
exports.onGameDeleted = onDocumentDeleted("games/{gameId}", async (event) => {
  // Inisialisasi klien dipindahkan ke DALAM fungsi
  const algoliaClient = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_API_KEY.value());
  const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME.value());

  const gameId = event.params.gameId;
  logger.info("Menghapus indeks game dari Algolia:", gameId);

  try {
    await index.deleteObject(gameId);
    logger.info("Sukses menghapus indeks:", gameId);
  } catch (error) {
    logger.error("Error saat menghapus indeks dari Algolia:", error);
  }
});
