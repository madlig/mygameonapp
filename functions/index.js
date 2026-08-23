// Impor modul-modul yang diperlukan
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// FIX: Import Algolia v5 yang benar (destructured, bukan .default)
const { algoliasearch } = require("algoliasearch");

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

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

  const algoliaClient = algoliasearch(
    ALGOLIA_APP_ID.value(),
    ALGOLIA_API_KEY.value()
  );

  logger.info("Mengindeks game baru ke Algolia:", gameId);

  const record = { objectID: gameId, ...newGameData };

  try {
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
    await algoliaClient.deleteObject({
      indexName: ALGOLIA_INDEX_NAME.value(),
      objectID: gameId,
    });
    logger.info("Sukses menghapus indeks:", gameId);
  } catch (error) {
    logger.error("Error saat menghapus indeks dari Algolia:", error);
  }
});

// ========================================================
// JOKI MULTI-TENANT: SUPER ADMIN FUNCTIONS
// ========================================================

/**
 * CLOUD FUNCTION #4: createJokiAdminUser
 * Super Admin creates a new admin user + assigns role + provisions workspace
 */
exports.createJokiAdminUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Harus login sebagai Super Admin.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  const isSuperAdmin = callerEmail.includes("mygameon") || request.auth.token.role === "admin" || request.auth.token.admin === true;
  
  if (!isSuperAdmin) {
    throw new HttpsError("permission-denied", "Hanya Super Admin yang berhak mendaftarkan akun admin baru.");
  }

  const { email, password, name, slug } = request.data || {};
  if (!email || !password || !name || !slug) {
    throw new HttpsError("invalid-argument", "Email, password, nama kanal, dan slug URL wajib diisi.");
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const cleanName = name.trim();

    // 1. Create or fetch User in Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(cleanEmail);
      if (password) {
        await admin.auth().updateUser(userRecord.uid, { password: password.trim() });
      }
    } catch (err) {
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password: password.trim(),
        displayName: cleanName,
      });
    }

    // 2. Set Admin Custom Claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: "admin",
    });

    // 3. Create or update Workspace Document in Firestore
    await admin.firestore().doc(`joki_workspaces/${cleanSlug}`).set({
      id: cleanSlug,
      name: cleanName,
      slug: cleanSlug,
      ownerEmail: cleanEmail,
      ownerUid: userRecord.uid,
      createdAt: Date.now(),
    }, { merge: true });

    // 4. Initialize global settings for workspace
    await admin.firestore().doc(`joki_workspaces/${cleanSlug}/settings/global`).set({
      globalPaused: false,
      globalPauseStarted: null,
      updatedAt: Date.now(),
    }, { merge: true });

    return {
      success: true,
      uid: userRecord.uid,
      email: cleanEmail,
      slug: cleanSlug,
      name: cleanName,
    };
  } catch (error) {
    logger.error("Error creating joki admin:", error);
    throw new HttpsError("internal", error.message || "Gagal membuat akun admin joki.");
  }
});

/**
 * CLOUD FUNCTION #5: deleteJokiAdminUser
 * Super Admin deletes a workspace and revokes user access
 */
exports.deleteJokiAdminUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Harus login sebagai Super Admin.");
  }

  const callerEmail = (request.auth.token.email || "").toLowerCase();
  const isSuperAdmin = callerEmail.includes("mygameon") || request.auth.token.role === "admin" || request.auth.token.admin === true;
  
  if (!isSuperAdmin) {
    throw new HttpsError("permission-denied", "Hanya Super Admin yang berhak menghapus akun admin.");
  }

  const { slug, uid } = request.data || {};
  if (!slug || slug === "mygameon") {
    throw new HttpsError("invalid-argument", "Kanal utama tidak dapat dihapus.");
  }

  try {
    // Delete workspace document
    await admin.firestore().doc(`joki_workspaces/${slug}`).delete();

    // If UID is provided and not primary admin, delete user from Auth
    if (uid) {
      try {
        await admin.auth().deleteUser(uid);
      } catch (e) {
        logger.warn("User already removed or not found:", uid);
      }
    }

    return { success: true, slug };
  } catch (error) {
    logger.error("Error deleting joki admin:", error);
    throw new HttpsError("internal", error.message || "Gagal menghapus admin joki.");
  }
});