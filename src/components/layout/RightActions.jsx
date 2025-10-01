// src/components/layout/RightActions.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext"; // <-- Impor useAuth

const RightActions = () => {
  const { logout } = useAuth(); // <-- Panggil fungsi logout dari AuthContext
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Arahkan ke halaman login setelah logout berhasil
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Gagal untuk logout.");
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Tombol Notifikasi */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-700 transition"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        <span className="absolute top-1 right-1 bg-red-600 text-xs font-bold text-white rounded-full h-4 w-4 flex items-center justify-center">
          3
        </span>
      </button>

      {/* Tombol Profil */}
      <button
        className="p-2 rounded-full hover:bg-gray-700 transition"
        aria-label="Profile"
      >
        <UserCircleIcon className="h-6 w-6" />
      </button>

      {/* Tombol Logout BARU */}
      <button
        onClick={handleLogout}
        className="p-2 rounded-full hover:bg-gray-700 transition"
        aria-label="Logout"
        title="Logout" // Tooltip
      >
        <ArrowRightOnRectangleIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default RightActions;