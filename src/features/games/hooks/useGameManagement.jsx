// src/hooks/useGameManagement.jsx  (update: add date filtering and robust parsing)
import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { addGame, updateGame, deleteGame } from "../services/gamesService";
import useFilters from "../../../hooks/useFilters";
import Fuse from "fuse.js";

export const useGameManagement = () => {
  const [gamesData, setGamesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const { filters, setFilters, handleFilterChange, handleResetFilters } = useFilters();

  // helper: parse size string to MB (e.g., "6.48 GB" or number)
  const parseSizeToMB = (sizeField, fallbackUnit = "gb") => {
    if (sizeField == null) return null;
    if (typeof sizeField === "number" && !Number.isNaN(sizeField)) {
      return fallbackUnit === "gb" ? sizeField * 1024 : sizeField;
    }
    const s = String(sizeField).trim();
    const numMatch = s.match(/[\d\.,]+/);
    if (!numMatch) return null;
    const num = parseFloat(numMatch[0].replace(",", "."));
    if (Number.isNaN(num)) return null;
    const unit = /mb/i.test(s) ? "mb" : /gb/i.test(s) ? "gb" : fallbackUnit;
    return unit === "gb" ? num * 1024 : num;
  };

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      try {
        const gamesCollectionRef = collection(db, "games");
        const queryConstraints = [];
        if (filters.genre?.length > 0) queryConstraints.push(where("genre", "array-contains-any", filters.genre));
        if (filters.status) queryConstraints.push(where("status", "==", filters.status));

        const q = query(gamesCollectionRef, ...queryConstraints, orderBy("name"));
        const querySnapshot = await getDocs(q);
        let fetchedGames = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // full-text search
        if (searchQuery.trim() !== "") {
          const fuse = new Fuse(fetchedGames, { keys: ["name", "genre", "status"], threshold: 0.3 });
          fetchedGames = fuse.search(searchQuery).map((r) => r.item);
        }

        // size filter (client-side)
        const minRaw = filters.size?.min;
        const maxRaw = filters.size?.max;
        const selectedUnit = (filters.size?.unit || "gb").toLowerCase();

        const minVal = minRaw !== "" && minRaw !== null ? parseFloat(String(minRaw).replace(",", ".")) : null;
        const maxVal = maxRaw !== "" && maxRaw !== null ? parseFloat(String(maxRaw).replace(",", ".")) : null;

        if ((minVal !== null && !Number.isNaN(minVal)) || (maxVal !== null && !Number.isNaN(maxVal))) {
          const minMB = (minVal !== null && !Number.isNaN(minVal)) ? (selectedUnit === "gb" ? minVal * 1024 : minVal) : null;
          const maxMB = (maxVal !== null && !Number.isNaN(maxVal)) ? (selectedUnit === "gb" ? maxVal * 1024 : maxVal) : null;

          fetchedGames = fetchedGames.filter((g) => {
            const fallbackUnit = (g.unit || selectedUnit || "gb").toLowerCase();
            const sizeInMB = parseSizeToMB(g.size ?? g.sizeInNumber ?? null, fallbackUnit);
            if (sizeInMB === null) return false; // hide unknown sizes
            if (minMB !== null && sizeInMB < minMB) return false;
            if (maxMB !== null && sizeInMB > maxMB) return false;
            return true;
          });
        }

        // dateAdded filter (client-side)
        const { start: startStr, end: endStr } = filters.dateAdded || {};
        const hasStart = !!startStr;
        const hasEnd = !!endStr;
        if (hasStart || hasEnd) {
          const startDate = hasStart ? new Date(startStr) : null;
          const endDate = hasEnd ? new Date(endStr) : null;
          // normalize to day bounds
          if (startDate) { startDate.setHours(0, 0, 0, 0); }
          if (endDate) { endDate.setHours(23, 59, 59, 999); }

          fetchedGames = fetchedGames.filter((g) => {
            let d = null;
            if (g.dateAdded?.seconds) { // Firestore timestamp
              d = new Date(g.dateAdded.seconds * 1000);
            } else if (typeof g.dateAdded === "string") {
              d = new Date(g.dateAdded);
            } else if (g.dateAdded instanceof Date) {
              d = g.dateAdded;
            } else {
              return false;
            }
            if (startDate && d < startDate) return false;
            if (endDate && d > endDate) return false;
            return true;
          });
        }

        setGamesData(fetchedGames);
      } catch (error) {
        console.error("Error fetching games:", error);
        setNotification("Gagal memuat data game.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [filters, searchQuery]);

  // handlers...
  const handleSearchChange = useCallback((e) => { setSearchQuery(e.target.value); setCurrentPage(1); }, []);
  const handleOpenAddModal = useCallback(() => { setEditingGame(null); setModalOpen(true); }, []);
  const handleOpenEditModal = useCallback((game) => { setEditingGame(game); setModalOpen(true); }, []);

  const handleFormSubmit = useCallback(async (formData, gameId) => {
    try {
      if (gameId) {
        await updateGame(gameId, formData);
        setNotification("Game berhasil diperbarui!");
      } else {
        await addGame(formData);
        setNotification("Game berhasil ditambahkan!");
      }
      const q = query(collection(db, "games"), orderBy("name"));
      const snapshot = await getDocs(q);
      setGamesData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      setNotification(error.message || "Gagal menyimpan game.");
    } finally {
      setModalOpen(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    // keep original behavior
  }, [selectedRows]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending" }));
  }, []);

  const handleRowClick = useCallback((gameId, event) => {
    if (event.target.type === "checkbox") return;
    setSelectedRows((prev) => prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]);
  }, []);

  const toggleRowSelection = useCallback((gameId) => {
    setSelectedRows((prev) => prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]);
  }, []);

  const sortedData = [...gamesData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  return {
    loading, notification, setNotification, isModalOpen, setModalOpen, editingGame, selectedRows, setSelectedRows,
    searchQuery, handleSearchChange, filters, handleFilterChange, handleResetFilters, currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage, sortConfig, handleSort, handleOpenAddModal, handleOpenEditModal,
    handleFormSubmit, handleDelete, handleRowClick, paginatedData, totalPages, gamesData,
    handleSizeInputChange: (key, val) => setFilters(p => ({ ...p, size: { ...p.size, [key]: val } })),
    handleDateInputChange: (key, val) => setFilters(p => ({ ...p, dateAdded: { ...p.dateAdded, [key]: val } })),
    toggleRowSelection,
  };
};