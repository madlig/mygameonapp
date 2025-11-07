
const StatusSelector = ({ selectedStatus, onSelect }) => {
  const statuses = [
    { label: "Shopee", color: "#FFA500" },
    { label: "Gdrive", color: "#34A853" },
  ];

  return (
    <div className="flex space-x-2">
      {statuses.map(({ label, color }) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(label)}
          className={`px-3 py-2 rounded ${
            selectedStatus === label
              ? "text-white"
              : "text-gray-700 hover:opacity-80"
          }`}
          style={{
            backgroundColor: selectedStatus === label ? color : "#E5E7EB",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default StatusSelector;
