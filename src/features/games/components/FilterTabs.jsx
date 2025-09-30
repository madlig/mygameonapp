import React from "react";

const FilterTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "genre", label: "Filter by Genre" }, // <-- Mengubah 'category' menjadi 'genre'
    { key: "status", label: "Filter by Status" },
    { key: "size", label: "Filter by Size" },
    { key: "dateAdded", label: "Filter by Date" },
  ];

  return (
    <div className="border-b border-gray-300">
      <div className="flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 border-b-2 ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterTabs;