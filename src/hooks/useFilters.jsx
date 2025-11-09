// src/hooks/useFilters.jsx
import { useState } from "react";

const useFilters = () => {
  const [filters, setFilters] = useState({
    genre: [],
    status: "",
    size: { min: "", max: "", unit: "MB" },
    dateAdded: { start: "", end: "" },
  });

  // FUNGSI YANG DIPERBARUI
  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      genre: [],
      status: "",
      size: { min: "", max: "", unit: "MB" },
      dateAdded: { start: "", end: "" },
    });
  };

  return { filters, setFilters, handleFilterChange, handleResetFilters };
};

export default useFilters;