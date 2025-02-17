import React from "react";

const FilterStatus = ({ statuses, selectedStatus, onChange }) => {
  return (
    <div className="relative">
      <select
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        value={selectedStatus}
        onChange={(e) => onChange(e, "status")}
      >
        <option value="" className="text-gray-500 font-medium bg-gray-100">
          All Status
        </option>
        {statuses.map((status) => (
          <option
            key={status}
            value={status}
            className="text-gray-800 font-medium bg-white hover:bg-blue-100"
          >
            {status}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterStatus;
