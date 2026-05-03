// src/features/games/hooks/useGamesData.js
//
// Custom hook untuk fetch dan merge data dari games/ + gamesPrivate/.
// - Real-time subscription (onSnapshot) untuk both collections
// - Auto-merge: setiap game punya field `_private` berisi data privat-nya
// - Loading & error states
//
// Returns:
//   {
//     games: Array<Game & { _private?: GamePrivate }>,
//     loading: boolean,
//     error: Error | null,
//   }

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';

export const useGamesData = () => {
  const [publicGames, setPublicGames] = useState([]);
  const [privateMap, setPrivateMap] = useState({});
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingPrivate, setLoadingPrivate] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe ke games/ collection (PUBLIC)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'games'),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPublicGames(docs);
        setLoadingPublic(false);
      },
      (err) => {
        console.error('[useGamesData] Error fetching games:', err);
        setError(err);
        setLoadingPublic(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe ke gamesPrivate/ collection (ADMIN-ONLY)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'gamesPrivate'),
      (snapshot) => {
        // Build a map: { [docId]: privateData }
        const map = {};
        snapshot.docs.forEach((d) => {
          map[d.id] = d.data();
        });
        setPrivateMap(map);
        setLoadingPrivate(false);
      },
      (err) => {
        // Kalau user bukan admin, akan kena permission-denied.
        // Itu OK — set privateMap kosong, jangan hancurkan UI.
        console.warn(
          '[useGamesData] gamesPrivate not accessible (likely non-admin):',
          err.code
        );
        setPrivateMap({});
        setLoadingPrivate(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Merge: setiap game dapat field _private dari gamesPrivate/{id}
  const games = publicGames.map((game) => ({
    ...game,
    _private: privateMap[game.id] || null,
  }));

  return {
    games,
    loading: loadingPublic || loadingPrivate,
    error,
  };
};
