// src/hooks/useGameManagement.jsx  (update: use SweetAlert2 + react-toastify for confirmation & toast/undo)
import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { addGame, updateGame, deleteGame } from "../services/gamesService";
import useFilters from "../../../hooks/useFilters";
import Fuse from "fuse.js";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import React from "react";

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

  // ref to hold pending deletion (ids, backupData, timerId, toastId)
  const pendingDeletionRef = useRef(null);
  const UNDO_TIMEOUT = 5000; // ms

  // helper: parse size string to MB (e.g., "6.48 GB" or number)
  const parseSizeToMB = (sizeField, fallbackUnit = "gb") => {
    if (sizeField == null) return null;
    if (typeof sizeField === "number" && !Number.isNaN(sizeField)) {
      return fallbackUnit === "gb" ? sizeField * 1024 : sizeField;
    }
    const s = String(sizeField).trim();
    const numMatch = s.match(/[\d\.,]+/);
    if (!numMatch) return null;
    const raw = numMatch[0].replace(",", ".");
    const num = parseFloat(raw);
    if (Number.isNaN(num)) return null;
    const unit = /mb/i.test(s) ? "mb" : /gb/i.test(s) ? "gb" : fallbackUnit;
    return unit === "gb" ? num * 1024 : num;
  };

  // helper: parse date-like field into JS Date (supports Firestore timestamp, string, Date)
  const parseToDate = (v) => {
    if (!v) return null;
    if (v.seconds && typeof v.seconds === "number") return new Date(v.seconds * 1000);
    if (v instanceof Date) return v;
    // try string
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    return null;
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
            const d = parseToDate(g.dateAdded);
            if (!d) return false;
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

  // handleDelete: use Swal confirmation + optimistic remove + toast with Undo
  const handleDelete = useCallback(async () => {
    if (!selectedRows || selectedRows.length === 0) {
      toast.info("Tidak ada item yang dipilih.");
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi hapus",
      text: `Anda akan menghapus ${selectedRows.length} game. Lanjutkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    // flush previous pending deletion (execute immediately)
    if (pendingDeletionRef.current) {
      clearTimeout(pendingDeletionRef.current.timerId);
      try {
        const prevIds = pendingDeletionRef.current.ids;
        await Promise.all(prevIds.map((id) => deleteGame(id)));
      } catch (err) {
        console.error("Error executing pending deletion:", err);
      }
      if (pendingDeletionRef.current.toastId) toast.dismiss(pendingDeletionRef.current.toastId);
      pendingDeletionRef.current = null;
    }

    const idsToDelete = [...selectedRows];
    const backupData = gamesData.filter((g) => idsToDelete.includes(g.id));

    // optimistic UI: remove from list immediately
    setGamesData((prev) => prev.filter((g) => !idsToDelete.includes(g.id)));
    setSelectedRows([]);

    // undo action
    const undoAction = () => {
      if (pendingDeletionRef.current) {
        clearTimeout(pendingDeletionRef.current.timerId);
        if (pendingDeletionRef.current.toastId) toast.dismiss(pendingDeletionRef.current.toastId);
        pendingDeletionRef.current = null;
        setGamesData((prev) => {
          // restore backup items at top and dedupe
          const restored = [...backupData, ...prev];
          const seen = new Set();
          return restored.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });
        toast.success("Penghapusan dibatalkan.");
      }
    };

    // render toast content with Undo button
    let localToastId = null;
    const toastContent = (
      <div className="flex items-center gap-3">
        <div>{idsToDelete.length} game dihapus.</div>
        <button
          onClick={() => {
            try {
              undoAction();
            } catch (e) {
              console.error("Undo action error:", e);
            }
          }}
          className="ml-3 underline text-sm"
        >
          Undo
        </button>
      </div>
    );

    // show toast (auto close after UNDO_TIMEOUT)
    localToastId = toast.info(toastContent, { autoClose: UNDO_TIMEOUT });

    // schedule actual delete after timeout
    const timerId = setTimeout(async () => {
      pendingDeletionRef.current = null;
      try {
        await Promise.all(idsToDelete.map((id) => deleteGame(id)));
        toast.dismiss(localToastId);
        toast.success(`${idsToDelete.length} game berhasil dihapus.`);
      } catch (error) {
        console.error("Delete error:", error);
        // if failure, try to restore backup to UI and inform user
        setGamesData((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const toRestore = backupData.filter((b) => !seen.has(b.id));
          return [...toRestore, ...prev];
        });
        toast.error("Terjadi kesalahan saat menghapus. Data dikembalikan.");
      }
    }, UNDO_TIMEOUT);

    // store pending deletion info
    pendingDeletionRef.current = { ids: idsToDelete, backup: backupData, timerId, toastId: localToastId };
  }, [selectedRows, gamesData]);

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

  // comparator aware of data types (size, jumlahPart, dateAdded)
  const comparator = (a, b) => {
    const key = sortConfig.key;
    const dir = sortConfig.direction === "ascending" ? 1 : -1;

    const getVal = (item) => {
      if (!key) return "";
      if (key === "size") {
        const fallbackUnit = (item.unit || "gb").toLowerCase();
        const mb = parseSizeToMB(item.size ?? item.sizeInNumber ?? null, fallbackUnit);
        return mb === null ? -Infinity : mb;
      }
      if (key === "jumlahPart" || key === "parts" || key === "partCount") {
        return Number(item.jumlahPart ?? item.parts ?? item.partCount ?? 0) || 0;
      }
      if (key === "dateAdded") {
        const d = parseToDate(item.dateAdded);
        return d ? d.getTime() : -Infinity;
      }
      const v = item[key];
      if (v == null) return "";
      if (typeof v === "string") return v.toLowerCase();
      try { return String(v).toLowerCase(); } catch { return String(v); }
    };

    const av = getVal(a);
    const bv = getVal(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  };

  const sortedData = [...gamesData].sort(comparator);

  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));

  return {
    loading, notification, setNotification, isModalOpen, setModalOpen, editingGame, selectedRows, setSelectedRows,
    searchQuery, handleSearchChange, filters, handleFilterChange, handleResetFilters, currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage, sortConfig, handleSort, handleOpenAddModal, handleOpenEditModal,
    handleFormSubmit, handleDelete, handleRowClick, paginatedData, totalPages, gamesData,
    handleSizeInputChange: (key, val) => setFilters(p => ({ ...p, size: { ...p.size, [key]: val } })),
    handleDateInputChange: (key, val) => setFilters(p => ({ ...p, dateAdded: { ...p.dateAdded, [key]: val } })),
    toggleRowSelection, parseSizeToMB,
  };
};