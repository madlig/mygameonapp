import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";

const useGamesData = (setGamesData) => {
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const gamesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGamesData(gamesList);
    });

    return () => unsubscribe();
  }, [setGamesData]);
};

export default useGamesData;
