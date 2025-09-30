// src/LocationSelector.jsx
import React, { useState, useEffect } from "react";
// Tidak perlu getFirestore lagi di sini, cukup collection dan getDocs
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig"; // Import konfigurasi Firebase yang sudah ada
import AddLocationModal from "../modals/AddLocationModal"; // Sesuaikan dengan lokasi modal Anda

const LocationSelector = ({ selectedLocation, onLocationChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [locations, setLocations] = useState([]);
  const [temporarySelection, setTemporarySelection] = useState(selectedLocation || ""); // Hanya satu lokasi yang dipilih
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  // Mengambil lokasi dari Firestore
  const fetchLocations = async () => {
    try {
      // *** PERUBAHAN DI SINI: Gunakan 'db' yang sudah diimpor di atas ***
      const querySnapshot = await getDocs(collection(db, "emailLocations"));
      const fetchedLocations = querySnapshot.docs.map((doc) => doc.data().email);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Sinkronisasi temporarySelection dengan selectedLocation dari prop
  // Penting jika parent mengubah selectedLocation dari luar
  useEffect(() => {
    setTemporarySelection(selectedLocation || "");
  }, [selectedLocation]);


  const handleLocationChange = (location) => {
    setTemporarySelection(location);
  };

  const handleConfirm = () => {
    onLocationChange(temporarySelection); // Update lokasi yang dipilih
    setShowDropdown(false);
  };

  const handleCancel = () => {
    setTemporarySelection(selectedLocation); // Kembalikan ke lokasi yang dipilih sebelumnya
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <button
        type="button"
        className="w-full px-4 py-2 bg-gray-200 rounded text-left border"
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        {selectedLocation ? `Selected: ${selectedLocation}` : "Select Location"}
      </button>
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded shadow-md mt-2 w-full">
          <div className="p-4 max-h-48 overflow-y-auto space-y-2">
            {locations.map((location, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={temporarySelection === location} // Hanya satu lokasi yang dipilih
                  onChange={() => handleLocationChange(location)} // Pilih lokasi
                  className="form-radio"
                />
                <span>{location}</span>
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
              onClick={() => setShowAddLocationModal(true)}
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

      {/* Modal untuk menambahkan lokasi baru */}
      <AddLocationModal
        showModal={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        onAddLocation={(newLocation) => {
          fetchLocations(); // Refresh daftar lokasi setelah menambahkan
          setTemporarySelection(newLocation); // Pilih lokasi baru
          onLocationChange(newLocation); // Update pilihan lokasi
        }}
      />
    </div>
  );
};

export default LocationSelector;