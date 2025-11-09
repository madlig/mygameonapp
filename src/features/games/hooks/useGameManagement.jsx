// src/hooks/useGameManagement.jsx

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { addGame, updateGame, deleteGame } from "../services/gamesService";
import useFilters from "../../../hooks/useFilters";
import Fuse from "fuse.js";
import { useAuth } from "../../../contexts/AuthContext";

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
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const { filters, setFilters, handleFilterChange, handleResetFilters } = useFilters();

    useEffect(() => {
        // ... (Fungsi fetching data tidak berubah)
        const fetchGames = async () => {
            setLoading(true);
            try {
                const gamesCollectionRef = collection(db, "games");
                const queryConstraints = [];
                // Defensive check: ensure filters.genre is an array and not empty
                if (Array.isArray(filters.genre) && filters.genre.length > 0) {
                    queryConstraints.push(where("genre", "array-contains-any", filters.genre));
                }
                if (filters.status) queryConstraints.push(where("status", "==", filters.status));
                
                const q = query(gamesCollectionRef, ...queryConstraints, orderBy("name"));
                const querySnapshot = await getDocs(q);
                let fetchedGames = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (searchQuery.trim() !== '') {
                    const fuse = new Fuse(fetchedGames, { keys: ["name", "genre", "status"], threshold: 0.3 });
                    fetchedGames = fuse.search(searchQuery).map(result => result.item);
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

    // Handler yang disempurnakan
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
            // Refresh data setelah submit
            const querySnapshot = await getDocs(query(collection(db, "games"), orderBy("name")));
            setGamesData(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            setNotification(error.message || "Gagal menyimpan game.");
        } finally {
            setModalOpen(false);
        }
    }, []);

    const handleDelete = useCallback(async () => {
        if (window.confirm(`Yakin ingin menghapus ${selectedRows.length} game terpilih?`)) {
            try {
                await Promise.all(selectedRows.map(id => deleteGame(id)));
                setGamesData((prev) => prev.filter((game) => !selectedRows.includes(game.id)));
                setSelectedRows([]);
                setNotification("Game terpilih berhasil dihapus!");
            } catch (error) {
                setNotification(error.message || "Gagal menghapus game.");
            }
        }
    }, [selectedRows]);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    }, []);

    const handleRowClick = useCallback((gameId, event) => {
        if (event.target.type === 'checkbox') return;
        setSelectedRows((prev) =>
            prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
        );
    }, []);

    const toggleRowSelection = useCallback((gameId) => {
        setSelectedRows((prev) =>
            prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]
        );
    }, []);

    // Logika sorting dan paginasi
    const sortedData = [...gamesData].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
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