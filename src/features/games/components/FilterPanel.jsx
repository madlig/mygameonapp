// src/pages/GamesPage/FilterPanel.jsx

import FilterGenre from "./filters/FilterGenre";
import FilterStatus from "./filters/FilterStatus";
import FilterSize from "./filters/FilterSize";
import FilterDate from "./filters/FilterDate";

const FilterSection = ({ title, children }) => (
  <div className="py-4">
    <h3 className="text-sm font-semibold text-gray-600 mb-3">{title}</h3>
    {children}
  </div>
);

const FilterPanel = ({
  genres, statuses, filters, handleGenreChange, handleFilterChange,
  handleSizeInputChange, handleDateInputChange
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-4">Filters</h2>
      <div className="divide-y divide-gray-200">
        <FilterSection title="Filter by Genre">
          <FilterGenre
            genres={genres}
            selectedGenres={filters.genre}
            onChange={handleGenreChange}
          />
        </FilterSection>

        <FilterSection title="Filter by Status">
          <FilterStatus
            statuses={statuses}
            selectedStatus={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
          />
        </FilterSection>
        
        <FilterSection title="Filter by Size">
          <FilterSize
            sizeInput={filters.size}
            onInputChange={handleSizeInputChange}
            // onApply dan onReset bisa ditambahkan di hook jika perlu
          />
        </FilterSection>

        <FilterSection title="Filter by Date">
          <FilterDate
            dateInput={filters.dateAdded}
            onInputChange={handleDateInputChange}
            // onApply dan onReset bisa ditambahkan di hook jika perlu
          />
        </FilterSection>
      </div>
    </div>
  );
};

export default FilterPanel;