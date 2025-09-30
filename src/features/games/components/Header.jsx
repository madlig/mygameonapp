// src/pages/GamesPage/Header.jsx
import React from "react";

const Header = ({ title, onAddNew, searchQuery, onSearchChange }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      
      {/* --- BAGIAN SEARCH BOX YANG DIPERBARUI --- */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            className="p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search Games..."
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
      </div>

      <button
        onClick={onAddNew}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-0.5"
      >
        + Add New Game
      </button>
    </div>
  );
};

export default Header;