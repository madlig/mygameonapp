// src/pages/GamesPage/filters/FilterGenre.jsx (sebelumnya FilterCategory.jsx)
import React from 'react';

// Asumsi FilterGenre menerima props 'genres' dan 'selectedGenres'
const FilterGenre = ({ genres = [], selectedGenres = [], onChange }) => {
  // Defensive checks: ensure genres and selectedGenres are arrays
  const safeGenres = Array.isArray(genres) ? genres : [];
  const safeSelectedGenres = Array.isArray(selectedGenres) ? selectedGenres : [];
  
  return (
    <div className="space-y-2">
      {safeGenres.map((genre) => (
        <label key={genre} className="flex items-center space-x-2 text-gray-700">
          <input
            type="checkbox"
            value={genre}
            checked={safeSelectedGenres.includes(genre)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              if (isChecked) {
                // Mengirim array baru langsung ke parent
                onChange([...safeSelectedGenres, genre]);
              } else {
                // Mengirim array baru langsung ke parent
                onChange(safeSelectedGenres.filter(item => item !== genre));
              }
            }}
            className="form-checkbox h-4 w-4 text-blue-600 rounded"
          />
          <span>{genre}</span>
        </label>
      ))}
    </div>
  );
};

export default FilterGenre;