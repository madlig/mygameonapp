// src/AddLocationModal.jsx
import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Modal from "../components/common/Modal";

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
    setStatusMessage("");

    try {
      await addDoc(collection(db, "emailLocations"), { email: newEmail });
      onAddLocation(newEmail);
      setNewEmail("");
      onClose();
    } catch (error) {
      console.error("Error adding email:", error);
      setStatusMessage("Failed to add email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (showModal) {
      setStatusMessage("");
      setNewEmail("");
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <Modal onClose={onClose} ariaLabel="Add Email Location">
      <div className="p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Email Location</h2>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter email"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {statusMessage && <p className="text-sm mt-2 text-center text-red-500">{statusMessage}</p>}
        <div className="flex justify-end space-x-4 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
          <button type="button" onClick={handleAddLocation} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddLocationModal;