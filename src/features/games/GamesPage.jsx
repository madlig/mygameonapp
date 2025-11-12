// src/pages/GamesPage/index.jsx (update: measure site header height and pass headerOffset to GameTable)
import React, { useEffect, useState, useCallback } from "react";
import { useGameManagement } from "./hooks/useGameManagement";
import { db, collection, getDocs } from "../../config/firebaseConfig";
import Pagination from "../../components/common/Pagination";
import Header from "./components/Header";
import GameFormModal from "./components/GameFormModal";
import ActiveFilters from "./components/ActiveFilters";
import SectionActions from "./components/SectionActions";
import GameTable from "./components/GameTable";
import FilterPanel from "./components/FilterPanel";

const GamesPage = () => {
  const {
    loading,
    notification,
    setNotification,
    isModalOpen,
    setModalOpen,
    editingGame,
    selectedRows,
    setSelectedRows,
    searchQuery,
    handleSearchChange,
    filters,
    handleFilterChange,
    handleResetFilters,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    sortConfig,
    handleSort,
    handleOpenAddModal,
    handleOpenEditModal,
    handleFormSubmit,
    handleDelete,
    handleRowClick,
    paginatedData,
    totalPages,
    gamesData,
    handleSizeInputChange,
    handleDateInputChange,
  } = useGameManagement();

  const [genres, setGenres] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // header offset (px) to ensure we can compute table available height;
  // passed to GameTable so it can calculate maxHeight for its scroll container
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    const fetchUiData = async () => {
      const genresSnapshot = await getDocs(collection(db, "genres"));
      setGenres(genresSnapshot.docs.map((doc) => doc.data().name));

      const gamesSnapshot = await getDocs(collection(db, "games"));
      const statusSet = new Set(gamesSnapshot.docs.map((doc) => doc.data().status).filter(Boolean));
      setStatuses([...statusSet]);
    };
    fetchUiData();
  }, []);

  useEffect(() => {
    const updateOffset = () => {
      // try common header selectors in order of likelihood
      const headerEl =
        document.querySelector(".site-header") ||
        document.querySelector("header") ||
        document.getElementById("header") ||
        document.querySelector(".app-header") ||
        null;

      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        const style = window.getComputedStyle(headerEl);
        const position = style.position || "";
        // only apply offset if header is fixed/sticky at top
        if (position === "fixed" || position === "sticky") {
          setHeaderOffset(Math.ceil(rect.height));
          return;
        }
      }
      setHeaderOffset(0);
    };

    // initial measurement + listeners
    updateOffset();
    window.addEventListener("resize", updateOffset);
    window.addEventListener("orientationchange", updateOffset);
    // in case header renders later (e.g. async), run again shortly
    const t = setTimeout(updateOffset, 250);

    return () => {
      window.removeEventListener("resize", updateOffset);
      window.removeEventListener("orientationchange", updateOffset);
      clearTimeout(t);
    };
  }, []);

  // Handler to remove filters (used by ActiveFilters)
  const handleRemoveFilter = useCallback(
    (type, value) => {
      if (type === "genre") {
        handleFilterChange("genre", (filters.genre || []).filter((g) => g !== value));
      } else if (type === "status") {
        handleFilterChange("status", "");
      } else if (type === "size") {
        handleFilterChange("size", { min: "", max: "", unit: "gb" });
      } else if (type === "dateAdded") {
        handleFilterChange("dateAdded", { start: "", end: "" });
      } else if (type === "all") {
        handleResetFilters();
      }
      // reset to first page after changing filters
      setCurrentPage(1);
    },
    [handleFilterChange, handleResetFilters, filters, setCurrentPage]
  );

  return (
    <div className="p-6 space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-4 font-bold">X</button>
        </div>
      )}

      <Header title="Games Management" onAddNew={handleOpenAddModal} searchQuery={searchQuery} onSearchChange={handleSearchChange} />

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
          {loading ? (
            <p className="text-center py-10">Memuat data game...</p>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} onResetAll={handleResetFilters} />
                {selectedRows.length > 0 && (
                  <SectionActions
                    selectedRows={selectedRows}
                    gamesData={gamesData}
                    onClose={() => setSelectedRows([])}
                    onEdit={() => {
                      const gameToEdit = gamesData.find((g) => g.id === selectedRows[0]);
                      if (gameToEdit) handleOpenEditModal(gameToEdit);
                    }}
                    onDelete={handleDelete}
                  />
                )}
              </div>

              <GameTable
                data={paginatedData}
                selectedRows={selectedRows}
                onRowClick={handleRowClick}
                onSort={handleSort}
                sortConfig={sortConfig}
                onSelectAll={(e) => setSelectedRows(e.target.checked ? paginatedData.map((g) => g.id) : [])}
                toggleRowSelection={(id) =>
                  setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                }
                headerOffset={headerOffset}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                onRowsPerPageChange={(val) => {
                  setRowsPerPage(val);
                  setCurrentPage(1);
                }}
                rowsPerPage={rowsPerPage}
              />
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <GameFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingGame} />
      )}
    </div>
  );
};

export default GamesPage;