// src/AddGenreModal.jsx
import React, { useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore"; // Menggunakan addDoc
import { db } from "../../config/firebaseConfig"; // Import konfigurasi Firebase

// Nama komponen diubah menjadi AddGenreModal
const AddGenreModal = ({ isOpen, onClose, onAddGenre }) => { // onAddCategory diubah menjadi onAddGenre
  const [newGenre, setNewGenre] = useState(""); // newCategory diubah menjadi newGenre
  const [loading, setLoading] = useState(false);

  const handleAddGenre = async () => { // handleAddCategory diubah menjadi handleAddGenre
    if (!newGenre.trim()) {
      alert("Genre name cannot be empty."); // Pesan diubah
      return;
    }
  
    setLoading(true);
  
    try {
      const genreName = newGenre.trim();
  
      // Periksa apakah genre sudah ada di koleksi 'genres'
      const querySnapshot = await getDocs(collection(db, "genres")); // Koleksi diubah ke "genres"
      const existingGenres = querySnapshot.docs.map((doc) => doc.data().name);
  
      if (existingGenres.includes(genreName)) {
        alert("Genre already exists."); // Pesan diubah
        setLoading(false);
        return;
      }
  
      // Tambahkan genre baru menggunakan addDoc (ID otomatis dari Firestore)
      await addDoc(collection(db, "genres"), { name: genreName }); // Koleksi diubah ke "genres"
  
      // Panggil onAddGenre untuk memperbarui UI di parent
      onAddGenre(genreName); // onAddCategory diubah menjadi onAddGenre
  
      setNewGenre(""); // Reset input field
      onClose(); // Tutup modal
    } catch (error) {
      console.error("Error adding genre: ", error); // Pesan error diubah
      alert("Failed to add genre. Please try again."); // Pesan error diubah
    } finally {
      setLoading(false);
    }
  }; 	

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-4">Add New Genre</h2> {/* Teks diubah */}
        <input
          type="text"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter genre name" // Placeholder diubah
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleAddGenre}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export komponen sebagai AddGenreModal
export default AddGenreModal;