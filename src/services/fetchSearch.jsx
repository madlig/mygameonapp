import { collection, query, where, getDocs, limit, startAfter } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

export const fetchGamesWithPagination = async (queryText, lastVisibleDoc = null) => {
  const gamesRef = collection(db, "games");
  let q = query(
    gamesRef,
    where("name_lower", ">=", queryText),
    where("name_lower", "<=", queryText + "\uf8ff"),
    limit(20) // Ambil 20 dokumen per halaman
  );

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  const snapshot = await getDocs(q);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  const games = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { games, lastVisible };
};
