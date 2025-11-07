// src/pages/GamesPage/filters/FilterGenre.jsx (sebelumnya FilterCategory.jsx)

// Asumsi FilterGenre menerima props 'genres' dan 'selectedGenres'
const FilterGenre = ({ genres, selectedGenres, onChange }) => {
  return (
    <div className="space-y-2">
      {genres.map((genre) => ( // <<<<<< Baris 6 ini kemungkinan besar penyebabnya
        <label key={genre} className="flex items-center space-x-2 text-gray-700">
          <input
            type="checkbox"
            value={genre}
            checked={selectedGenres.includes(genre)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              if (isChecked) {
                // Mengirim array baru langsung ke parent
                onChange([...selectedGenres, genre]);
              } else {
                // Mengirim array baru langsung ke parent
                onChange(selectedGenres.filter(item => item !== genre));
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