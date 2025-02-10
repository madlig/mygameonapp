import { useState } from "react";

const useFilters = () => {
  const [filters, setFilters] = useState({
    category: [],
    status: "",
    size: { min: "", max: "", unit: "gb" },
    dateAdded: { start: "", end: "" },
  });

  const handleFilterChange = (e, filterType) => {
    const value = e.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  return { filters, setFilters, handleFilterChange };
};

export default useFilters;
