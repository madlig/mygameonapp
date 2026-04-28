// src/features/games/hooks/useMetadataGenres.js
//
// Hook untuk fetch genres dari metadata collection.
// Digunakan untuk dropdown filter genre di GamesPage.
//
// Returns:
//   { genres: Array<{id, label}>, loading: boolean }
//
// Note: Filter isActive & sort dilakukan di client-side untuk
// menghindari kebutuhan composite index Firestore.
// Performance impact: nihil (cuma ~18 entries).

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';

export const useMetadataGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, 'metadata', 'genres', 'entries');

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((g) => g.isActive !== false) // include if isActive is true OR undefined
          .sort((a, b) => (a.label || '').localeCompare(b.label || ''));

        setGenres(data);
        setLoading(false);

        if (data.length === 0) {
          console.warn(
            '[useMetadataGenres] No genres found. ' +
              'Check Firestore: metadata/genres/entries/ should have 18 docs.'
          );
        }
      },
      (err) => {
        console.error('[useMetadataGenres] Error:', err);
        setGenres([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { genres, loading };
};
