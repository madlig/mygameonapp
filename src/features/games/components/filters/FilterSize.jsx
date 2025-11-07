// src/pages/GamesPage/filters/FilterSize.jsx

const FilterSize = ({ sizeInput, onApply, onReset, onInputChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Size</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={sizeInput.min}
              onChange={(e) => onInputChange("min", e.target.value)}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sizeInput.unit}
              onChange={(e) => onInputChange("min", e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="gb">GB</option>
              <option value="mb">MB</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Size</label>
          <input
            type="number"
            value={sizeInput.max}
            onChange={(e) => onInputChange("max", e.target.value)}
            className="w-20 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
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

export default FilterSize;