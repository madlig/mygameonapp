// src/FilterDate.jsx
import React from "react";

const FilterDate = ({ dateInput, onApply, onReset, onInputChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={dateInput.startDate}
            onChange={(e) => onInputChange("startDate", e.target.value)}
            className="w-40 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={dateInput.endDate}
            onChange={(e) => onInputChange("endDate", e.target.value)}
            className="w-40 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onApply}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow hover:bg-gray-400 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterDate;