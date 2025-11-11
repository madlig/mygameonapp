// src/pages/GamesPage/index.jsx
import React, { useEffect, useState } from "react";
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
import { PlusIcon } from "@heroicons/react/24/outline";

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

    // Mobile: toggle untuk menampilkan/menyembunyikan filter panel (opsional)
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

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

            {/* Mobile: tombol toggle filter */}
            <div className="flex items-center justify-between lg:hidden mb-2">
              <button
                onClick={() => setShowFiltersMobile((s) => !s)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm"
              >
                {showFiltersMobile ? "Close Filters" : "Show Filters"}
              </button>
              <div className="text-sm text-gray-600">Total: {gamesData.length}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filter panel */}
                <div className="lg:col-span-1">
                  <div className="hidden lg:block">
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

                  {/* Mobile collapsible */}
                  {showFiltersMobile && (
                    <div className="block lg:hidden mb-4">
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold">Filters</h3>
                          <button onClick={() => setShowFiltersMobile(false)} className="text-sm text-gray-500">Close</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
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
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-3">
                    {loading ? (<p className="text-center py-10">Memuat data game...</p>) : (
                        <>
                            <div className="space-y-4 mb-4">
                                <ActiveFilters filters={filters} onRemoveFilter={(type, value) => { /* ... (logika sama) ... */ }} onResetAll={handleResetFilters} />
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
                            <div className="mt-4">
                              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} onRowsPerPageChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} rowsPerPage={rowsPerPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile FAB: muncul hanya di layar kecil */}
            <div className="lg:hidden">
              <button
                onClick={handleOpenAddModal}
                aria-label="Add new game"
                className="fixed right-4 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center
                           bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] lg:bottom-6 lg:right-6"
              >
                {/* PlusIcon import tetap ada di file header; pastikan PlusIcon diimpor */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>

            {isModalOpen && <GameFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingGame} />}
        </div>
    );
};

export default GamesPage;