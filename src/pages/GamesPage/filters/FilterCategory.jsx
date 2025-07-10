import React from "react";

const FilterCategory = ({ categories, selectedCategories, onChange }) => {
  return (
    <div className="flex flex-wrap space-x-4">
      {categories.map((category) => (
        <label
          key={category}
          className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 p-2 rounded shadow-sm cursor-pointer transition"
        >
          <input
            type="checkbox"
            value={category}
            checked={selectedCategories.includes(category)}
            onChange={(e) => onChange(e)}
            className="form-checkbox text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-800 font-medium">{category}</span>
        </label>
      ))}
    </div>
  );
};

export default FilterCategory;
