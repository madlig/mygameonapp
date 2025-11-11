// src/pages/GamesPage/Header.jsx
import React from "react";

const Header = ({ title, onAddNew, searchQuery, onSearchChange }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        </div>

        {/* Search + action group */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          {/* Search: full width on mobile */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Games..."
                value={searchQuery}
                onChange={onSearchChange}
              />
            </div>
          </div>

          {/* Add New Game - shown on sm+ in header */}
          <div className="hidden sm:block">
            <button
              onClick={onAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
            >
              + Add New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;