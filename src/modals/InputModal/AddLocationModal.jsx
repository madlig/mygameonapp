import React, { useState } from "react";
import { getFirestore, addDoc, collection } from "firebase/firestore";

const AddLocationModal = ({ showModal, onClose, onAddLocation }) => {
  const [newEmail, setNewEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddLocation = async () => {
    if (!newEmail.trim()) {
      setStatusMessage("Email is required");
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setStatusMessage("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();
      // Menambahkan lokasi baru ke Firestore
      await addDoc(collection(db, "emailLocations"), { email: newEmail });

      // Panggil onAddLocation untuk memperbarui UI di LocationSelector
      onAddLocation(newEmail);

      // Reset input field dan status
      setNewEmail("");
      setStatusMessage("");
      onClose(); // Tutup modal setelah berhasil
    } catch (error) {
      console.error("Error adding email:", error);
      setStatusMessage("Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Add Email Location</h2>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {statusMessage && (
          <p className="text-sm mt-2 text-center text-red-500">{statusMessage}</p>
        )}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;
