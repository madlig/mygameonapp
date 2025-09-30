// src/pages/LandingPage/RequestGame.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { Link } from "react-router-dom"; // Import Link

const RequestGame = () => {
  const [game, setGame] = useState("");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState(""); // State baru untuk platform
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // State untuk menampilkan pesan sukses

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!game || !username) {
      alert("Mohon isi Nama Game dan Username Shopee!");
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      const requestsRef = collection(db, "requests");

      await addDoc(requestsRef, {
        earliestDate: formattedDate,
        game,
        latestDate: formattedDate,
        platforms: platform ? [platform] : [], // Simpan sebagai array agar konsisten
        statusColumn: "pending",
        requestCount: 1, // Setiap request dihitung 1
        usernameShopee: username,
      });

      setIsSuccess(true); // Tampilkan pesan sukses
      setGame("");
      setUsername("");
      setPlatform("");
    } catch (error) {
      console.error("Error submitting request: ", error);
      alert("Terjadi kesalahan, silakan coba lagi.");
    }

    setLoading(false);
  };

  // Jika sukses, tampilkan halaman terima kasih
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-center px-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">Terima Kasih!</h1>
          <p className="text-gray-600 mt-2">
            Permintaan game Anda telah kami terima dan akan segera ditinjau oleh tim kami.
          </p>
          <Link to="/" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Sederhana */}
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-6xl mx-auto px-6">
          <Link to="/" className="text-3xl font-extrabold text-blue-700 hover:text-blue-900 transition-colors">
            myGameON Hub
          </Link>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Request Game</h1>
            <p className="text-gray-500 mt-2">Belum menemukan game yang Anda cari? Request di sini!</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Game
              </label>
              <input
                id="gameName"
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="shopeeUsername" className="block text-sm font-medium text-gray-700 mb-1">
                Username Shopee
              </label>
              <input
                id="shopeeUsername"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full py-3 text-white rounded-lg font-semibold transition-all duration-300 ${
                loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-1"
              }`}
              disabled={loading}
            >
              {loading ? "Mengirim..." : "Submit Request"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RequestGame;