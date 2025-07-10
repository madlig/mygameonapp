import { collection, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";


// Tambahkan game baru ke Firestore
export const addGame = async (gameData) => {
  try {
    const newGameRef = doc(collection(db, "games"));
    await setDoc(newGameRef, gameData);

    return { id: newGameRef.id, ...gameData }; // Kembalikan data game baru beserta ID
  } catch (error) {
    console.error("Error adding new game:", error);
    throw error;
  }
};


// Hapus game berdasarkan ID
export const deleteGame = async (gameId) => {
  try {
    await deleteDoc(doc(db, "games", gameId));
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

// Ambil game berdasarkan ID
export const getGameById = async (gameId) => {
  try {
    const gameDoc = await getDoc(doc(db, "games", gameId));
    if (gameDoc.exists()) {
      return { id: gameId, ...gameDoc.data() };
    } else {
      throw new Error("Game not found");
    }
  } catch (error) {
    console.error("Error fetching game:", error);
    throw error;
  }
};

// Perbarui game berdasarkan ID
export const updateGame = async (gameId, updatedData) => {
  try {
    const gameRef = doc(db, "games", gameId);
    await setDoc(gameRef, updatedData, { merge: true }); // Gunakan merge untuk hanya memperbarui field tertentu
    return { id: gameId, ...updatedData };
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};