import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import Modal from "../../../components/common/Modal";
import Swal from "sweetalert2";

/**
 * AddNewRequest
 * - Adds a new request or increments requestCount if the same game already exists in "Requested List".
 * - DOES NOT perform optimistic UI mutation to avoid duplicates with the onSnapshot listener in RequestsPage.
 * - Includes Estimated Size (GB) input.
 */
const AddNewRequest = ({ closeModal, requests /* read-only lookup only */ }) => {
  const [formData, setFormData] = useState({
    game: "",
    platforms: [], // kept for backward compatibility / current UI
    earliestDate: "",
    estimatedSize: "", // new optional field (GB)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformChange = (platform) => {
    setFormData((prev) => {
      const platforms = Array.isArray(prev.platforms) ? [...prev.platforms] : [];
      if (platforms.includes(platform)) {
        return { ...prev, platforms: platforms.filter((p) => p !== platform) };
      }
      return { ...prev, platforms: [...platforms, platform] };
    });
  };

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const gameName = String(formData.game || "").trim();
      if (!gameName) {
        Swal.fire("Peringatan", "Masukkan nama game.", "warning");
        setIsSubmitting(false);
        return;
      }

      // lookup existing in current "Requested List" snapshot (if provided)
      const existingRequest = (requests && requests["Requested List"])
        ? requests["Requested List"].find(
            (r) => String(r.game || "").trim().toLowerCase() === gameName.toLowerCase()
          )
        : null;

      if (existingRequest) {
        // increment requestCount and optionally update latestDate and estimatedSize if provided
        const updatedRequestCount = (existingRequest.requestCount || 0) + 1;
        const updatePayload = {
          requestCount: updatedRequestCount,
          latestDate: formData.earliestDate || existingRequest.latestDate || new Date().toISOString().split("T")[0],
        };
        if (formData.estimatedSize !== "" && !Number.isNaN(Number(formData.estimatedSize))) {
          updatePayload.estimatedSize = Number(formData.estimatedSize);
        }
        await updateDoc(doc(db, "requests", existingRequest.id), updatePayload);

        // Do NOT mutate local state here; onSnapshot will update the UI.
        Swal.fire("Berhasil", "Request digabungkan ke Requested List.", "success");
      } else {
        // create new request doc
        const newRequest = {
          game: gameName,
          platforms: Array.isArray(formData.platforms) ? formData.platforms : [],
          earliestDate: formData.earliestDate || new Date().toISOString().split("T")[0],
          latestDate: formData.earliestDate || new Date().toISOString().split("T")[0],
          statusColumn: "Requested List",
          requestCount: 1,
          estimatedSize: formData.estimatedSize !== "" && !Number.isNaN(Number(formData.estimatedSize))
            ? Number(formData.estimatedSize)
            : 0,
          createdAt: new Date()
        };

        await addDoc(collection(db, "requests"), newRequest);
        // Do NOT mutate local state; onSnapshot will pick up new doc and update UI.
        Swal.fire("Berhasil", "Request baru berhasil ditambahkan.", "success");
      }

      // close modal & reset form
      closeModal();
      setFormData({ game: "", platforms: [], earliestDate: "", estimatedSize: "" });
    } catch (error) {
      console.error("Error adding/updating request card: ", error);
      Swal.fire("Error", "Gagal memproses request. Cek console untuk detail.", "error");
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Estimated Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Estimated Size (GB) - optional</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.estimatedSize}
              onChange={(e) => setFormData({ ...formData, estimatedSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. 12.5"
            />
            <p className="text-xs text-gray-400 mt-1">Isi jika Anda tahu perkiraan ukuran file (GB). Berguna untuk prioritas / batching.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Platforms</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["OvaGames", "SteamRIP", "RepackGames"].map((platform) => (
                <label
                  key={platform}
                  className={`px-3 py-1 border rounded-md cursor-pointer ${
                    (formData.platforms || []).includes(platform)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={platform}
                    checked={(formData.platforms || []).includes(platform)}
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600"
            >
              {isSubmitting ? "Processing..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddNewRequest;