
const UnitSelector = ({ selectedUnit, onSelect }) => {
  const units = ["MB", "GB"];

  return (
    <div className="flex space-x-2">
      {units.map((unit) => (
        <button
          key={unit}
          type="button"
          onClick={() => onSelect(unit)}
          className={`px-3 py-2 rounded ${
            selectedUnit === unit
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
          }`}
        >
          {unit}
        </button>
      ))}
    </div>
  );
};

export default UnitSelector;
