// src/components/GameCard.jsx
import React from 'react';

const GameCard = ({ game }) => {
  // Fallback untuk coverArtUrl jika kosong atau tidak ada
  const defaultCoverArtUrl = "https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Image"; 

  // Memastikan game.genre adalah array dan menggabungkannya menjadi string
  const displayGenre = Array.isArray(game.genre) && game.genre.length > 0
    ? game.genre.join(', ')
    : 'No Genre';

  // Mendapatkan display untuk ukuran dan unit
  // Pastikan game.size dan game.unit ada, jika tidak, gunakan default
  const displaySizeAndUnit = (game.size && game.unit) 
    ? `${game.size} ${game.unit}` 
    : 'Ukuran: N/A'; // Ini akan menampilkan "Ukuran: N/A" jika data tidak lengkap

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <img
        src={game.coverArtUrl || defaultCoverArtUrl}
        alt={game.name}
        className="w-full h-56 object-cover"
      />
      <div className="p-4">
        <h4 className="text-xl font-semibold mb-2 line-clamp-1">{game.name}</h4>

        <p className="text-sm text-gray-600 mb-1">
          {game.platform} | {displayGenre}
        </p>

        {/* Menampilkan Ukuran (Size dan Unit) agar lebih ter-highlight */}
        {/* Menggunakan displaySizeAndUnit untuk mencakup unit, dan ukuran font lebih besar */}
        <p className="text-lg font-bold text-gray-800 mb-3">
          {displaySizeAndUnit}
        </p>

        {/* Tombol "Beli di Shopee" - SELALU MUNCUL, tidak bergantung status */}
        <a
          href="#" // Mengarah ke # karena URL afiliasi belum tersedia
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-orange-500 text-white text-center py-2 rounded-md hover:bg-orange-600 transition-colors"
        >
          Beli di Shopee
        </a>
      </div>
    </div>
  );
};

export default GameCard;