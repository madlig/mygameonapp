import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ActiveFilters = ({ filters, onRemoveFilter }) => {
  return (
    (filters.category.length > 0 || filters.status) && (
      <div className="flex space-x-4 mt-4">
        {filters.category.map((category) => (
          <div
            key={category}
            className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
          >
            <span>{category}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter("category", category)}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filters.status && (
          <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <span>{filters.status}</span>
            <button
              className="ml-2 text-blue-700 hover:text-blue-900"
              onClick={() => onRemoveFilter("status")}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  );
};

export default ActiveFilters;
