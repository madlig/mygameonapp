import { doc, deleteDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

export const moveGameToGamesTable = async (gameId, gameName) => {
    if (!gameId || !gameName) {
        console.error("Kesalahan: gameId atau gameName tidak ditemukan.");
        return;
    }

    try {
        console.log("Memindahkan game:", gameId, gameName);

        // Tambahkan game ke koleksi "games" dengan hanya nama
        await addDoc(collection(db, "games"), {
            name: gameName,
            dateAdded: new Date().toISOString(),
            isIncomplete: true // Menandakan data belum lengkap
        });

        console.log("Game berhasil ditambahkan ke Firestore!");

        // Hapus game dari RequestsPage setelah dipindahkan
        await deleteDoc(doc(db, "requests", gameId));
        console.log("Game berhasil dihapus dari requests!");

        alert(`"${gameName}" berhasil dipindahkan ke GamesPage!`);
    } catch (error) {
        console.error("Gagal memindahkan game:", error);
        alert("Terjadi kesalahan saat memindahkan game, coba lagi.");
    }
};
