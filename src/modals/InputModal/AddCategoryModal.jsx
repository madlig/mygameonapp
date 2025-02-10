import React, { useState } from "react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig"; // Import konfigurasi Firebase

const AddCategoryModal = ({ isOpen, onClose, onAddCategory }) => {
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
  
    setLoading(true);
  
    try {
      const categoryName = newCategory.trim();
  
      // Periksa apakah kategori sudah ada
      const querySnapshot = await getDocs(collection(db, "categories"));
      const existingCategories = querySnapshot.docs.map((doc) => doc.data().name);
  
      if (existingCategories.includes(categoryName)) {
        alert("Category already exists.");
        setLoading(false);
        return;
      }
  
      // Tentukan ID berdasarkan jumlah dokumen
      const nextCategoryId = `category${querySnapshot.size + 1}`;
  
      // Tambahkan kategori baru
      const categoryRef = doc(db, "categories", nextCategoryId);
      await setDoc(categoryRef, { name: categoryName });
  
      // Panggil onAddCategory untuk memperbarui UI
      onAddCategory(categoryName);
  
      setNewCategory(""); // Reset input field
      onClose(); // Tutup modal
    } catch (error) {
      console.error("Error adding category: ", error);
      alert("Failed to add category. Please try again.");
    } finally {
      setLoading(false);
    }
  };  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
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
            onClick={handleAddCategory}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
