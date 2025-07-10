import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig"; // Import konfigurasi Firebase
import AddCategoryModal from "../modals/InputModal/AddCategoryModal";

const CategorySelector = ({ availableCategories, selectedCategories, onChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [temporarySelection, setTemporarySelection] = useState([...selectedCategories]);
  const [categories, setCategories] = useState([...availableCategories]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Mengambil kategori dari Firestore saat komponen dimuat
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const fetchedCategories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories: ", error);
    }
  };

  // Memanggil fetchCategories saat komponen pertama kali dimuat atau setelah kategori ditambahkan
  useEffect(() => {
    fetchCategories();
  }, []); // Kosongkan dependency array untuk mengambil data hanya sekali saat pertama kali dimuat

  const toggleCategory = (category) => {
    if (temporarySelection.includes(category)) {
      setTemporarySelection(temporarySelection.filter((c) => c !== category));
    } else if (temporarySelection.length < 3) {
      setTemporarySelection([...temporarySelection, category]);
    }
  };

  const handleConfirm = () => {
    onChange(temporarySelection);
    setShowDropdown(false);
  };

  const handleCancel = () => {
    setTemporarySelection([...selectedCategories]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-200 rounded text-left border"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        {selectedCategories.length > 0
          ? `Selected (${selectedCategories.length}): ${selectedCategories.join(", ")}`
          : "Select Categories"}
      </button>
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded shadow-md mt-2 w-full">
          <div className="p-4 max-h-48 overflow-y-auto space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={temporarySelection.includes(category.name)}
                  onChange={() => toggleCategory(category.name)}
                  className="form-checkbox"
                />
                <span>{category.name}</span>
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
              onClick={() => setShowAddCategoryModal(true)}
            >
              Add New
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
        {selectedCategories.map((category) => (
          <span
            key={category}
            className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            {category}
            <button
              type="button"
              className="ml-2 text-red-500 hover:text-red-700"
              onClick={() => onChange(selectedCategories.filter((c) => c !== category))}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Modal for Adding New Category */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onAddCategory={(newCategory) => {
          // Setelah kategori baru ditambahkan, refresh daftar kategori
          fetchCategories();
          onChange([...selectedCategories, newCategory]); // Update selected categories
        }}
      />
    </div>
  );
};

export default CategorySelector;
