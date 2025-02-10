import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const LandingPage = () => {
  const [game, setGame] = useState("");
  const [platform, setPlatform] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "requestHistory"), {
        game,
        requestDate: new Date().toISOString().split("T")[0],
        requestedBy: "User123", // Ganti dengan ID user sebenarnya jika menggunakan auth
      });
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request: ", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Request a Game</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">Game Name</label>
          <input
            type="text"
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          >
            <option value="">Select Platform</option>
            <option value="OvaGames">OvaGames</option>
            <option value="SteamRIP">SteamRIP</option>
            <option value="RepackGames">RepackGames</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default LandingPage;
