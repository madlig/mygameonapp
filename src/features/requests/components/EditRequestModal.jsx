import React, { useState } from "react";

const EditRequestModal = ({ request, onClose, onSave }) => {
  const [formData, setFormData] = useState(request);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform) => {
    setFormData((prev) => {
      const platforms = [...(prev.platforms || [])]; // Pastikan platforms tidak undefined
      if (platforms.includes(platform)) {
        return { ...prev, platforms: platforms.filter((p) => p !== platform) };
      } else {
        return { ...prev, platforms: [...platforms, platform] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      ></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-96">
        <h2 className="text-xl font-bold mb-4">Edit Request</h2>
        <form onSubmit={handleSubmit}>
          {/* Game Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Game Name
            </label>
            <input
              type="text"
              name="game"
              value={formData.game}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Request Count */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Request Count
            </label>
            <input
              type="number"
              name="requestCount"
              value={formData.requestCount}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Platforms Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {["OvaGames", "SteamRIP", "RepackGames"].map((platform) => (
                <label
                  key={platform}
                  className={`px-3 py-1 border rounded-md cursor-pointer ${
                    formData.platforms?.includes(platform)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={platform}
                    checked={formData.platforms?.includes(platform)}
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
    </div>
  );
};

export default EditRequestModal;
