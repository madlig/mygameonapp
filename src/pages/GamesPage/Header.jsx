import React from "react";

const Header = ({ title, onAddNew }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
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
