// src/GenreSelector.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig"; // Import konfigurasi Firebase
import AddGenreModal from "../modals/InputModal/AddGenreModal"; // Import AddGenreModal yang sudah disesuaikan

// Mengganti nama komponen dari CategorySelector menjadi GenreSelector
// Menyesuaikan prop names dari availableCategories ke availableGenres, selectedCategories ke selectedGenres
const GenreSelector = ({ selectedGenres, onChange }) => { // availableCategories dihapus
  const [showDropdown, setShowDropdown] = useState(false);
  // temporarySelection juga disesuaikan
  const [temporarySelection, setTemporarySelection] = useState([...selectedGenres]);
  // categories disesuaikan menjadi genres
  const [genres, setGenres] = useState([]); // Inisialisasi kosong, akan diisi dari Firestore
  const [showAddGenreModal, setShowAddGenreModal] = useState(false); // showAddCategoryModal disesuaikan

  // Mengambil genre dari Firestore saat komponen dimuat atau setelah genre baru ditambahkan
  const fetchGenres = async () => { // fetchCategories disesuaikan menjadi fetchGenres
    try {
      const querySnapshot = await getDocs(collection(db, "genres")); // Koleksi diubah ke "genres"
      const fetchedGenres = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setGenres(fetchedGenres); // setCategories disesuaikan menjadi setGenres
    } catch (error) {
      console.error("Error fetching genres: ", error); // Pesan error disesuaikan
    }
  };

  // Memanggil fetchGenres saat komponen pertama kali dimuat
  useEffect(() => {
    fetchGenres();
  }, []); // Kosongkan dependency array untuk mengambil data hanya sekali saat pertama kali dimuat

  // Sinkronisasi temporarySelection dengan selectedGenres dari prop
  // Penting jika parent mengubah selectedGenres dari luar
  useEffect(() => {
    setTemporarySelection([...selectedGenres]);
  }, [selectedGenres]);


  // toggleCategory disesuaikan menjadi toggleGenre
  const toggleGenre = (genreName) => { // category diubah menjadi genreName
    if (temporarySelection.includes(genreName)) {
      setTemporarySelection(temporarySelection.filter((g) => g !== genreName));
    } else if (temporarySelection.length < 3) { // Batasan 3 genre masih dipertahankan
      setTemporarySelection([...temporarySelection, genreName]);
    }
  };

  const handleConfirm = () => {
    onChange(temporarySelection);
    setShowDropdown(false);
  };

  const handleCancel = () => {
    setTemporarySelection([...selectedGenres]); // Menggunakan selectedGenres
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-200 rounded text-left border"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        {/* selectedCategories diubah menjadi selectedGenres */}
        {selectedGenres.length > 0
          ? `Selected (${selectedGenres.length}): ${selectedGenres.join(", ")}`
          : "Select Genres"} {/* Teks diubah */}
      </button>
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded shadow-md mt-2 w-full">
          <div className="p-4 max-h-48 overflow-y-auto space-y-2">
            {/* categories.map diubah menjadi genres.map */}
            {genres.map((genre) => ( // category diubah menjadi genre
              <label key={genre.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={temporarySelection.includes(genre.name)} // category.name diubah menjadi genre.name
                  onChange={() => toggleGenre(genre.name)} // toggleCategory diubah menjadi toggleGenre, category.name diubah
                  className="form-checkbox"
                />
                <span>{genre.name}</span> {/* category.name diubah menjadi genre.name */}
              </label>
            ))}
          </div>
          <div className="flex justify-between border-t p-2 bg-gray-50">
            <button
              type="button"
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleConfirm}
            >
              OK
            </button>
            <button
              type="button"
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => setShowAddGenreModal(true)} // setShowAddCategoryModal disesuaikan
            >
              Add New {/* Teks diubah, bisa juga "Add New Genre" */}
            </button>
            <button
              type="button"
              className="px-4 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* selectedCategories.map diubah menjadi selectedGenres.map */}
        {selectedGenres.map((genre) => ( // category diubah menjadi genre
          <span
            key={genre}
            className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            {genre}
            <button
              type="button"
              className="ml-2 text-red-500 hover:text-red-700"
              // selectedCategories diubah menjadi selectedGenres
              onClick={() => onChange(selectedGenres.filter((g) => g !== genre))} // category diubah menjadi genre
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Modal for Adding New Genre */}
      <AddGenreModal // Komponen modal diubah namanya
        isOpen={showAddGenreModal} // showAddCategoryModal disesuaikan
        onClose={() => setShowAddGenreModal(false)} // setShowAddCategoryModal disesuaikan
        onAddGenre={(newGenreName) => { // onAddCategory diubah menjadi onAddGenre, newCategory diubah menjadi newGenreName
          fetchGenres(); // Refresh daftar genre
          // Pastikan newGenreName ditambahkan ke pilihan yang sedang aktif
          // dan juga ke temporarySelection agar langsung terlihat terpilih jika diinginkan
          onChange([...selectedGenres, newGenreName]);
          setTemporarySelection((prev) => [...prev, newGenreName]);
        }}
      />
    </div>
  );
};

export default GenreSelector;