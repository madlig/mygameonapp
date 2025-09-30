// src/hooks/MultiSelectDropdown.jsx
import React, { useState, useEffect } from "react";

const MultiSelectDropdown = ({
  options, // Daftar pilihan (e.g., ['Action', 'RPG'])
  selectedOptions, // Pilihan yang sudah ada (e.g., ['Action'])
  onChange, // Fungsi untuk mengupdate state di parent
  onAddNew, // Fungsi untuk membuka modal "Add New"
  onDelete, // Fungsi untuk menghapus pilihan
  placeholderText, // Teks placeholder (e.g., "Select Genres")
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [temporarySelection, setTemporarySelection] = useState([...selectedOptions]);

  useEffect(() => {
    setTemporarySelection([...selectedOptions]);
  }, [selectedOptions]);

  const toggleOption = (option) => {
    setTemporarySelection((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleConfirm = () => {
    onChange(temporarySelection);
    setShowDropdown(false);
  };

  const handleCancel = () => {
    setTemporarySelection([...selectedOptions]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-200 rounded text-left border"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        {selectedOptions.length > 0
          ? `Selected (${selectedOptions.length}): ${selectedOptions.join(", ")}`
          : placeholderText}
      </button>
      {showDropdown && (
        <div className="absolute z-20 bg-white border rounded shadow-md mt-2 w-full">
          <div className="p-4 max-h-48 overflow-y-auto space-y-2">
            {options.map((option) => (
              <div key={option} className="flex items-center justify-between group">
                <label className="flex items-center space-x-2 flex-grow cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temporarySelection.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="form-checkbox"
                  />
                  <span>{option}</span>
                </label>
                {/* Tombol Hapus */}
                <button
                  type="button"
                  onClick={() => onDelete(option)}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${option}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
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
              onClick={() => {
                onAddNew();
                setShowDropdown(false);
              }}
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
    </div>
  );
};

export default MultiSelectDropdown;