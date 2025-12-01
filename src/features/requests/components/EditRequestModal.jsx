import React, { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";

/**
 * EditRequestModal
 * - Includes Estimated Size (GB) field.
 * - Normalizes estimatedSize to Number before calling onSave.
 */
const EditRequestModal = ({ request, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...request,
    estimatedSize: request?.estimatedSize ?? ""
  });

  useEffect(() => {
    setFormData({ ...request, estimatedSize: request?.estimatedSize ?? "" });
  }, [request]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform) => {
    setFormData((prev) => {
      const platforms = Array.isArray(prev.platforms) ? [...prev.platforms] : [];
      if (platforms.includes(platform)) {
        return { ...prev, platforms: platforms.filter((p) => p !== platform) };
      } else {
        return { ...prev, platforms: [...platforms, platform] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // normalize estimatedSize (if empty -> 0, otherwise number)
    const normalized = { ...formData };
    if (normalized.estimatedSize !== undefined && normalized.estimatedSize !== "") {
      normalized.estimatedSize = Number(normalized.estimatedSize);
      if (Number.isNaN(normalized.estimatedSize)) normalized.estimatedSize = 0;
    } else {
      normalized.estimatedSize = 0;
    }
    // normalize requestCount if present
    if (normalized.requestCount !== undefined) {
      const rc = Number(normalized.requestCount);
      normalized.requestCount = Number.isFinite(rc) ? rc : (request.requestCount || 0);
    }
    onSave(normalized);
  };

  if (!request) return null;

  return (
    <Modal onClose={onClose} ariaLabel="Edit Request">
      <div className="p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Request</h2>
        <form onSubmit={handleSubmit}>
          {/* Game Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Game Name</label>
            <input
              type="text"
              name="game"
              value={formData.game || ""}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Estimated Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Estimated Size (GB)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              name="estimatedSize"
              value={formData.estimatedSize ?? ""}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. 12.5"
            />
          </div>

          {/* Request Count */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Request Count</label>
            <input
              type="number"
              name="requestCount"
              value={formData.requestCount ?? 0}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Platforms Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Platforms</label>
            <div className="flex flex-wrap gap-2">
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

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditRequestModal;