// src/hooks/useFilters.js
import { useState } from "react";

const useFilters = () => {
  const [filters, setFilters] = useState({
    genre: [], // Sudah benar sebagai array kosong
    status: "",
    size: { min: "", max: "", unit: "gb" },
    dateAdded: { start: "", end: "" },
  });

  // Perbaiki handleFilterChange: Sekarang menerima filterType (string) dan value (nilai filter) secara langsung
  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  // Tambahkan fungsi handleResetFilters untuk mereset semua filter
  const handleResetFilters = () => {
    setFilters({
      genre: [],
      status: "",
      size: { min: "", max: "", unit: "gb" },
      dateAdded: { start: "", end: "" },
    });
  };

  // Pastikan Anda mengembalikan handleResetFilters agar bisa digunakan di GamesPage
  return { filters, setFilters, handleFilterChange, handleResetFilters };
};

export default useFilters;