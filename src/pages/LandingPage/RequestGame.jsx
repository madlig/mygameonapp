import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const RequestGame = () => {
  const [game, setGame] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!game || !username) {
      alert("Mohon isi semua kolom!");
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // Format YYYY-MM-DD

      const requestsRef = collection(db, "requests");

      // Tambahkan request baru dengan status "pending" dan requestCount = 0
      await addDoc(requestsRef, {
        earliestDate: formattedDate,
        game,
        latestDate: formattedDate,
        platforms: [],
        statusColumn: "pending",
        requestCount: 0, // Awalnya 0, bertambah saat diterima di Pending Requests
        usernameShopee: username,
      });

      alert("Request berhasil dikirim! Mohon ditunggu informasi selanjutnya.");
      setGame("");
      setUsername("");
    } catch (error) {
      console.error("Error submitting request: ", error);
      alert("Terjadi kesalahan, silakan coba lagi.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Request a Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">Nama Game</label>
          <input
            type="text"
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">Username Shopee</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 text-white rounded ${loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
          disabled={loading}
        >
          {loading ? "Mengirim..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default RequestGame;
