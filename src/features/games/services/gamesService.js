// src/services/gamesService.jsx

import { collection, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export const addGame = async (gameData) => {
  try {
    // Gunakan addDoc agar ID dibuat otomatis oleh Firestore
    await addDoc(collection(db, "games"), gameData);
  } catch (error) {
    console.error("Error adding new game:", error);
    // Lempar error dengan pesan yang lebih berguna
    throw new Error("Gagal menambahkan game baru ke database.");
  }
};

export const deleteGame = async (gameId) => {
  try {
    await deleteDoc(doc(db, "games", gameId));
  } catch (error) {
    console.error("Error deleting game:", error);
    throw new Error("Gagal menghapus game dari database.");
  }
};

export const updateGame = async (gameId, updatedData) => {
  try {
    const gameRef = doc(db, "games", gameId);
    await setDoc(gameRef, updatedData, { merge: true });
  } catch (error) {
    console.error("Error updating game:", error);
    throw new Error("Gagal memperbarui data game di database.");
  }
};

// getGameById tidak perlu diubah karena sudah melempar error
// export { getGameById } from './gamesService'; // Asumsikan ini sudah ada