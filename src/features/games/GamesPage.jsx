// src/pages/GamesPage/index.jsx

import { useEffect, useState } from "react";
import { useGameManagement } from "./hooks/useGameManagement";
import { db, collection, getDocs } from "../../config/firebaseConfig";

// Import semua komponen UI yang dibutuhkan
import Pagination from "../../components/common/Pagination";
import Header from "./components/Header";
import GameFormModal from "./components/GameFormModal";
import ActiveFilters from "./components/ActiveFilters";
import SectionActions from "./components/SectionActions";
import GameTable from "./components/GameTable";
import FilterPanel from "./components/FilterPanel";

const GamesPage = () => {
    // Panggil hook untuk mendapatkan semua state dan logika
    const {
        loading, notification, setNotification, isModalOpen, setModalOpen, editingGame,
        selectedRows, setSelectedRows, searchQuery, handleSearchChange, filters,
        handleFilterChange, handleResetFilters, currentPage, setCurrentPage,
        rowsPerPage, setRowsPerPage, sortConfig, handleSort, handleOpenAddModal,
        handleOpenEditModal, handleFormSubmit, handleDelete, handleRowClick,
        paginatedData, totalPages, gamesData, handleSizeInputChange, handleDateInputChange
    } = useGameManagement();

    // State khusus untuk data UI (genres, statuses)
    const [genres, setGenres] = useState([]);
    const [statuses, setStatuses] = useState([]);

    useEffect(() => {
        const fetchUiData = async () => {
            const genresSnapshot = await getDocs(collection(db, "genres"));
            setGenres(genresSnapshot.docs.map(doc => doc.data().name));

            const gamesSnapshot = await getDocs(collection(db, 'games'));
            const statusSet = new Set(gamesSnapshot.docs.map(doc => doc.data().status).filter(Boolean));
            setStatuses([...statusSet]);
        };
        fetchUiData();
    }, []);

    // Render UI
    return (
        <div className="p-6 space-y-6">
            {notification && (
                <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)} className="ml-4 font-bold">X</button>
                </div>
            )}

            <Header
                title="Games Management"
                onAddNew={handleOpenAddModal}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <FilterPanel
                        genres={genres}
                        statuses={statuses}
                        filters={filters}
                        handleGenreChange={(newGenres) => handleFilterChange("genre", newGenres)}
                        handleFilterChange={handleFilterChange}
                        handleSizeInputChange={handleSizeInputChange}
                        handleDateInputChange={handleDateInputChange}
                    />
                </div>

                <div className="lg:col-span-3">
                    {loading ? (<p className="text-center py-10">Memuat data game...</p>) : (
                        <>
                            <div className="space-y-4 mb-4">
                                <ActiveFilters filters={filters} onRemoveFilter={() => { /* ... (logika sama) ... */ }} onResetAll={handleResetFilters} />
                                {selectedRows.length > 0 && (
                                    <SectionActions
                                        selectedRows={selectedRows}
                                        gamesData={gamesData}
                                        onClose={() => setSelectedRows([])}
                                        onEdit={() => {
                                            const gameToEdit = gamesData.find(g => g.id === selectedRows[0]);
                                            if (gameToEdit) handleOpenEditModal(gameToEdit);
                                        }}
                                        onDelete={handleDelete}
                                    />
                                )}
                            </div>
                            <GameTable data={paginatedData} selectedRows={selectedRows} onRowClick={handleRowClick} onSort={handleSort} sortConfig={sortConfig} onSelectAll={(e) => setSelectedRows(e.target.checked ? paginatedData.map((g) => g.id) : [])} />
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} onRowsPerPageChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} rowsPerPage={rowsPerPage} />
                        </>
                    )}
                </div>
            </div>

            {isModalOpen && <GameFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingGame} />}
        </div>
    );
};

export default GamesPage;