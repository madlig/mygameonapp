import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"; // Import onSnapshot
import { db } from "../../../config/firebaseConfig";
import { addGame, updateGame, deleteGame } from "../services/gamesService";
import useFilters from "../../../hooks/useFilters";
import Fuse from "fuse.js";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import React from "react";

export const useGameManagement = () => {
  const [gamesData, setGamesData] = useState([]);
  const [filteredAndSortedData, setFilteredAndSortedData] = useState([]); // State baru untuk data yang sudah difilter & sort
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
  const pendingDeletionRef = useRef(null);
  const UNDO_TIMEOUT = 5000;

  const parseSizeToMB = (sizeField, fallbackUnit = "gb") => {
    // ... (fungsi ini tidak berubah)
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

  const parseToDate = (v) => {
    // ... (fungsi ini tidak berubah)
    if (!v) return null;
    if (v.seconds && typeof v.seconds === "number") return new Date(v.seconds * 1000);
    if (v instanceof Date) return v;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    return null;
  };
  
  // ====================================================================
  // PERUBAHAN UTAMA: Gunakan onSnapshot untuk data real-time
  // ====================================================================
  useEffect(() => {
    setLoading(true);
    const gamesCollectionRef = collection(db, "games");
    
    // Hanya query dasar. Filter akan dilakukan di client-side setelah data masuk.
    const q = query(gamesCollectionRef, orderBy("name"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedGames = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGamesData(fetchedGames); // Simpan data mentah dari Firestore
      setLoading(false);
    }, (error) => {
      console.error("Error fetching games with onSnapshot:", error);
      setNotification("Gagal memuat data game secara real-time.");
      setLoading(false);
    });

    // Cleanup listener saat komponen unmount
    return () => unsubscribe();
  }, []); // Dependency array kosong, hanya berjalan sekali.

  // ====================================================================
  // EFEK BARU: Lakukan filtering dan searching di client-side
  // setiap kali data mentah (gamesData) atau filter berubah.
  // ====================================================================
  useEffect(() => {
    let processedData = [...gamesData];

    // 1. Full-text search
    if (searchQuery.trim() !== "") {
      const fuse = new Fuse(processedData, { keys: ["name", "genre", "status"], threshold: 0.3 });
      processedData = fuse.search(searchQuery).map((r) => r.item);
    }
    
    // 2. Filter berdasarkan genre
    if (filters.genre?.length > 0) {
        processedData = processedData.filter(game =>
            filters.genre.every(g => game.genre?.includes(g))
        );
    }

    // 3. Filter berdasarkan status
    if (filters.status) {
        processedData = processedData.filter(game => game.status === filters.status);
    }

    // 4. Filter berdasarkan ukuran (size)
    const minRaw = filters.size?.min;
    const maxRaw = filters.size?.max;
    const selectedUnit = (filters.size?.unit || "gb").toLowerCase();
    const minVal = minRaw !== "" && minRaw !== null ? parseFloat(String(minRaw).replace(",", ".")) : null;
    const maxVal = maxRaw !== "" && maxRaw !== null ? parseFloat(String(maxRaw).replace(",", ".")) : null;

    if ((minVal !== null && !Number.isNaN(minVal)) || (maxVal !== null && !Number.isNaN(maxVal))) {
      const minMB = (minVal !== null && !Number.isNaN(minVal)) ? (selectedUnit === "gb" ? minVal * 1024 : minVal) : null;
      const maxMB = (maxVal !== null && !Number.isNaN(maxVal)) ? (selectedUnit === "gb" ? maxVal * 1024 : maxVal) : null;
      processedData = processedData.filter((g) => {
        const fallbackUnit = (g.unit || selectedUnit || "gb").toLowerCase();
        const sizeInMB = parseSizeToMB(g.size ?? g.sizeInNumber ?? null, fallbackUnit);
        if (sizeInMB === null) return false;
        if (minMB !== null && sizeInMB < minMB) return false;
        if (maxMB !== null && sizeInMB > maxMB) return false;
        return true;
      });
    }
    
    // 5. Filter berdasarkan tanggal
    const { start: startStr, end: endStr } = filters.dateAdded || {};
    if (startStr || endStr) {
      const startDate = startStr ? new Date(startStr) : null;
      const endDate = endStr ? new Date(endStr) : null;
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      processedData = processedData.filter((g) => {
        const d = parseToDate(g.dateAdded);
        if (!d) return false;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }

    // 6. Sorting
    const comparator = (a, b) => {
        const key = sortConfig.key;
        const dir = sortConfig.direction === "ascending" ? 1 : -1;
        const getVal = (item) => {
            if (key === "size") return parseSizeToMB(item.size, "gb") || -Infinity;
            if (key === "dateAdded") return parseToDate(item.dateAdded)?.getTime() || -Infinity;
            if (key === "jumlahPart") return Number(item.jumlahPart) || 0;
            const v = item[key];
            return typeof v === 'string' ? v.toLowerCase() : v;
        };
        const av = getVal(a);
        const bv = getVal(b);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
    };
    processedData.sort(comparator);

    setFilteredAndSortedData(processedData);
    setCurrentPage(1); // Reset ke halaman 1 setiap kali filter berubah

  }, [gamesData, filters, searchQuery, sortConfig]); // <-- Dependensi yang benar


  const handleSearchChange = useCallback((e) => { setSearchQuery(e.target.value); }, []);
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
      // Kita tidak perlu fetch data lagi, onSnapshot akan melakukannya.
    } catch (error) {
      setNotification(error.message || "Gagal menyimpan game.");
    } finally {
      setModalOpen(false);
    }
  }, []);

  // ====================================================================
  // PERBAIKAN PADA handleDelete: Hapus Optimistic UI Update
  // Biarkan onSnapshot yang menangani penghapusan dari UI secara alami.
  // ====================================================================
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

    const idsToDelete = [...selectedRows];
    setSelectedRows([]);

    // Tidak perlu lagi optimistic UI update. Cukup hapus dari database.
    // `onSnapshot` akan secara otomatis mendeteksi penghapusan ini dan memperbarui `gamesData`.
    try {
      await Promise.all(idsToDelete.map((id) => deleteGame(id)));
      toast.success(`${idsToDelete.length} game berhasil dihapus.`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Terjadi kesalahan saat menghapus data.");
    }
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
  
  // Gunakan data yang sudah difilter dan disort untuk paginasi
  const paginatedData = filteredAndSortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / rowsPerPage));
  
  return {
    loading, notification, setNotification, isModalOpen, setModalOpen, editingGame, selectedRows, setSelectedRows,
    searchQuery, handleSearchChange, filters, handleFilterChange, handleResetFilters, currentPage, setCurrentPage,
    rowsPerPage, setRowsPerPage, sortConfig, handleSort, handleOpenAddModal, handleOpenEditModal,
    handleFormSubmit, handleDelete, handleRowClick, paginatedData, totalPages, 
    gamesData: filteredAndSortedData, // <-- Kirim data yang sudah diolah ke komponen
    handleSizeInputChange: (key, val) => setFilters(p => ({ ...p, size: { ...p.size, [key]: val } })),
    handleDateInputChange: (key, val) => setFilters(p => ({ ...p, dateAdded: { ...p.dateAdded, [key]: val } })),
    toggleRowSelection, parseSizeToMB,
  };
};