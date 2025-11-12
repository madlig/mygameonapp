import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import Modal from "../../../components/common/Modal";

const AddNewRequest = ({ closeModal, requests, setRequests }) => {
  const [formData, setFormData] = useState({
    game: "",
    platforms: [], // Array untuk platform
    earliestDate: "",
  });

  const handleAddRequest = async (e) => {
    e.preventDefault();

    try {
      // Check if the game already exists
      const existingRequest = requests["Requested List"].find(
        (req) => req.game === formData.game
      );

      if (existingRequest) {
        // If it exists, update requestCount and latestDate
        const updatedRequestCount = existingRequest.requestCount + 1;

        await updateDoc(doc(db, "requests", existingRequest.id), {
          requestCount: updatedRequestCount,
          latestDate: formData.earliestDate,
        });

        // Update state
        setRequests((prev) => {
          const updatedRequests = [...prev["Requested List"]];
          const requestIndex = updatedRequests.findIndex(
            (req) => req.id === existingRequest.id
          );

          updatedRequests[requestIndex] = {
            ...existingRequest,
            requestCount: updatedRequestCount,
            latestDate: formData.earliestDate,
          };

          return {
            ...prev,
            "Requested List": updatedRequests,
          };
        });

        alert("Request updated successfully!");
      } else {
        // If it doesn't exist, add a new request
        const newRequest = {
          ...formData,
          requestCount: 1, // First request
          latestDate: formData.earliestDate, // LatestDate is the same as earliestDate
          statusColumn: "Requested List", // Default status
        };

        const docRef = await addDoc(collection(db, "requests"), newRequest);

        // Update state
        setRequests((prev) => ({
          ...prev,
          "Requested List": [
            ...prev["Requested List"],
            { id: docRef.id, ...newRequest },
          ],
        }));

        alert("Request added successfully!");
      }

      closeModal(); // Close the modal
      setFormData({ game: "", platforms: [], earliestDate: "" }); // Reset form
    } catch (error) {
      console.error("Error adding/updating request card: ", error);
      alert("Failed to process request!");
    }
  };

  const handlePlatformChange = (platform) => {
    setFormData((prev) => {
      const platforms = [...prev.platforms];
      if (platforms.includes(platform)) {
        // Remove platform if already selected
        return { ...prev, platforms: platforms.filter((p) => p !== platform) };
      } else {
        // Add platform if not selected
        return { ...prev, platforms: [...prev, platform] };
      }
    });
  };

  return (
    <Modal onClose={closeModal} ariaLabel="Add Request">
      <div className="p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Request</h2>
        <form onSubmit={handleAddRequest}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Game Name</label>
            <input
              type="text"
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Platforms</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["OvaGames", "SteamRIP", "RepackGames"].map((platform) => (
                <label
                  key={platform}
                  className={`px-3 py-1 border rounded-md cursor-pointer ${
                    formData.platforms.includes(platform)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={platform}
                    checked={formData.platforms.includes(platform)}
                    onChange={() => handlePlatformChange(platform)}
                    className="hidden"
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Request Date</label>
            <input
              type="date"
              value={formData.earliestDate}
              onChange={(e) => setFormData({ ...formData, earliestDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded hover:bg-gray-500"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddNewRequest;