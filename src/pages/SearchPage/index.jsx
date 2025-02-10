import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Fuse from "fuse.js";

const ITEMS_PER_PAGE = 6; // Jumlah item yang ditampilkan per load

const SearchGame = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [visibleGames, setVisibleGames] = useState([]); // Data yang sedang ditampilkan
  const [loadedCount, setLoadedCount] = useState(ITEMS_PER_PAGE); // Jumlah yang ditampilkan

  useEffect(() => {
    const fetchGames = async () => {
      const querySnapshot = await getDocs(collection(db, "games"));
      const gamesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(gamesData);
      setSearchResults(gamesData);
      setVisibleGames(gamesData.slice(0, ITEMS_PER_PAGE)); // Load awal
    };

    fetchGames();
  }, []);

  const fuse = new Fuse(games, {
    keys: ["name", "genre", "description"],
    threshold: 0.3,
  });

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults(games);
      setVisibleGames(games.slice(0, ITEMS_PER_PAGE));
      setLoadedCount(ITEMS_PER_PAGE);
    } else {
      const results = fuse.search(query).map((result) => result.item);
      setSearchResults(results);
      setVisibleGames(results.slice(0, ITEMS_PER_PAGE));
      setLoadedCount(ITEMS_PER_PAGE);
    }
  };

  const handleLoadMore = () => {
    const newCount = loadedCount + ITEMS_PER_PAGE;
    setLoadedCount(newCount);
    setVisibleGames(searchResults.slice(0, newCount));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Search Games</h1>
      <input
        type="text"
        placeholder="Search games..."
        value={searchQuery}
        onChange={handleSearch}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Grid Card Layout */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleGames.length > 0 ? (
          visibleGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:scale-105 transition-transform duration-200"
            >
              <img
                src={game.image || "https://via.placeholder.com/300"}
                alt={game.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold">{game.name}</h3>
                <p className="text-sm text-gray-500">{game.genre || "Unknown Genre"}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-red-500 mt-4">No games found.</p>
        )}
      </div>

      {/* Load More Button */}
      {visibleGames.length < searchResults.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchGame;
