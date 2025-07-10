import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Fuse from "fuse.js";

const SearchGame = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "games"));
        const gameList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGames(gameList);
        setFilteredGames(gameList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching games:", error);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Konfigurasi Fuse.js untuk pencarian
  useEffect(() => {
    if (!searchQuery) {
      setFilteredGames(games);
      return;
    }

    const fuse = new Fuse(games, {
      keys: ["name", "platforms"],
      threshold: 0.3,
    });

    const result = fuse.search(searchQuery).map((item) => item.item);
    setFilteredGames(result);
  }, [searchQuery, games]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Input Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Loading State */}
      {loading && <p className="text-center">Loading games...</p>}

      {/* Grid Game List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGames.map((game) => (
          <div key={game.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <img
              src={game.cover || "/placeholder.jpg"}
              alt={game.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-800">{game.name}</h3>
              <p className="text-xs text-gray-600">
                {game.platforms && Array.isArray(game.platforms) ? game.platforms.join(", ") : "Unknown"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Jika tidak ada hasil */}
      {!loading && filteredGames.length === 0 && (
        <p className="text-center text-gray-500">Tidak ada game ditemukan.</p>
      )}
    </div>
  );
};

export default SearchGame;
