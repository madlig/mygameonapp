// src/services/algoliaUploader.js

import algoliasearch from "algoliasearch";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebaseConfig.js";
// Konfigurasi Algolia
const algoliaClient = algoliasearch("YOUR_APP_ID", "YOUR_ADMIN_API_KEY");
const algoliaIndex = algoliaClient.initIndex("games");

const uploadDataToAlgolia = async () => {
  try {
    console.log("Fetching data from Firestore...");
    const gamesSnapshot = await getDocs(collection(db, "games"));
    const records = gamesSnapshot.docs.map((doc) => ({
      objectID: doc.id,
      ...doc.data(),
    }));

    console.log("Data fetched:", records);

    console.log("Uploading data to Algolia...");
    await algoliaIndex.saveObjects(records);
    console.log("Data successfully uploaded to Algolia!");
  } catch (error) {
    console.error("Failed to upload data to Algolia:", error);
  }
};

export default uploadDataToAlgolia;
