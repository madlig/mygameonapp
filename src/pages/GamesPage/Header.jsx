import React from "react";

const Header = ({ title, onAddNew, searchQuery, onSearchChange }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search Games..."
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <button
        onClick={onAddNew}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        + Add New Game
      </button>
    </div>
  );
};

export default Header;
