// src/AddGenreModal.jsx
import React, { useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore"; // Menggunakan addDoc
import { db } from "../config/firebaseConfig"; // Import konfigurasi Firebase
import Modal from "../components/common/Modal";

const AddGenreModal = ({ isOpen, onClose, onAddGenre }) => {
  const [newGenre, setNewGenre] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddGenre = async () => {
    if (!newGenre.trim()) {
      alert("Genre name cannot be empty.");
      return;
    }
  
    setLoading(true);
  
    try {
      const genreName = newGenre.trim();
  
      // Periksa apakah genre sudah ada di koleksi 'genres'
      const querySnapshot = await getDocs(collection(db, "genres"));
      const existingGenres = querySnapshot.docs.map((doc) => doc.data().name);
  
      if (existingGenres.includes(genreName)) {
        alert("Genre already exists.");
        setLoading(false);
        return;
      }
  
      // Tambahkan genre baru menggunakan addDoc (ID otomatis dari Firestore)
      await addDoc(collection(db, "genres"), { name: genreName });
  
      // Panggil onAddGenre untuk memperbarui UI di parent
      onAddGenre(genreName);
  
      setNewGenre(""); // Reset input field
      onClose(); // Tutup modal
    } catch (error) {
      console.error("Error adding genre: ", error);
      alert("Failed to add genre. Please try again.");
    } finally {
      setLoading(false);
    }
  }; 	

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} ariaLabel="Add Genre">
      <div className="p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Genre</h2>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter genre name"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={handleAddGenre} disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddGenreModal;