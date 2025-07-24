// src/GamesPage.jsx
import React, { useState, useEffect } from "react";
import { db,collection, getDocs } from "../../config/firebaseConfig";
import useGamesData from "../../hooks/useGamesData";
import useFilters from "../../hooks/useFilters";
import Pagination from "../../components/Pagination";
import AddNewGameForm from "../../modals/InputModal/AddNewGameForm";
import EditGameModal from "../../modals/EditModal/EditGameModal";
import Header from "./Header";
import FilterTabs from "./FilterTabs";
import ActiveFilters from "./ActiveFilters";
import FilterSize from "./filters/FilterSize";
import FilterStatus from "./filters/FilterStatus";
import FilterGenre from "./filters/FilterGenre"; // Mengganti FilterCategory menjadi FilterGenre
import FilterDate from "./filters/FilterDate";
import SectionActions from "./SectionActions";
import GameTable from "./GameTable";
import Fuse from "fuse.js";

const GamesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [gamesData, setGamesData] = useState([]); // State untuk menyimpan data game
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeFilterTab, setActiveFilterTab] = useState("genre"); // Mengganti default tab ke "genre"
  const { filters, setFilters, handleFilterChange, handleResetFilters } = useFilters();
  const [sizeInput, setSizeInput] = useState({
    min: "",
    unit: "gb", // Default unit
    max: "",
  });
  // Mengubah nama key dari 'start'/'end' menjadi 'startDate'/'endDate' agar konsisten dengan FilterDate
  const [dateInput, setDateInput] = useState({
    startDate: "",
    endDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [notification, setNotification] = useState(null); // State untuk notifikasi

  const handleFormSubmit = async (newGameData) => {
    console.log("Form submitted with data:", newGameData);

    try {
      const newGame = await addGame(newGameData);
      setGamesData((prevGames) => [...prevGames, newGame]);
      handleCloseModal();
      setNotification("Game added successfully!"); // Notifikasi sukses
    } catch (error) {
      console.error("Error adding new game: ", error);
      setNotification("Failed to add new game. Please try again."); // Notifikasi error
    }
  };

  useGamesData(setGamesData); // Pastikan useGamesData mengembalikan game dengan 'id' dari Firestore

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const [statuses, setStatuses] = useState([]);
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const statusSet = new Set();
        gamesSnapshot.docs.forEach(doc => {
          const gameData = doc.data();
          if (gameData.status) {
            statusSet.add(gameData.status);
          }
        });
        setStatuses([...statusSet]);
      } catch (error) {
        console.error('Error fetching statuses: ', error);
      }
    };
    fetchStatuses();
  }, []);

  // Mengganti 'categories' menjadi 'genres'
  const [genres, setGenres] = useState([]);
  useEffect(() => {
    const fetchGenres = async () => {
      // Pastikan Anda memiliki koleksi "genres" di Firestore, jika tidak, sesuaikan path ini
      const genresCollection = collection(db, "genres"); 
      const genreSnapshot = await getDocs(genresCollection);
      const genreList = genreSnapshot.docs.map(doc => doc.data().name);
      setGenres(genreList);
    };
    fetchGenres();
  }, []);

  const handleRowClick = (gameId, e) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey; // Tambah metaKey untuk Mac

    if (isCtrlPressed) {
      setSelectedRows((prevSelectedRows) => {
        if (prevSelectedRows.includes(gameId)) {
          return prevSelectedRows.filter((id) => id !== gameId);
        } else {
          return [...prevSelectedRows, gameId];
        }
      });
    } else {
      setSelectedRows([gameId]);
      setSelectedGameId(gameId);
    }
  };

  const closeActions = () => {
    setSelectedRows([]);
  };

  // Mengganti handleCategoryChange menjadi handleGenreChange
  // Menerima array baru langsung dari FilterGenre
  const handleGenreChange = (newGenresArray) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      genre: newGenresArray, // Mengganti 'category' menjadi 'genre'
    }));
  };

  // Mengganti 'category' menjadi 'genre'
  const handleRemoveFilter = (filterType, value = null) => {
    setFilters((prevFilters) => {
      if (filterType === "genre") { // Mengganti "category" menjadi "genre"
        return {
          ...prevFilters,
          genre: prevFilters.genre.filter((gen) => gen !== value), // Mengganti 'category' menjadi 'genre'
        };
      }
      return {
        ...prevFilters,
        [filterType]: "",
      };
    });
  };

  const handleApplySizeFilter = () => {
    const { min, max, unit } = sizeInput;

    // Validasi: Min tidak boleh melebihi Max setelah konversi ke unit dasar (misal MB)
    const minVal = parseFloat(min) || 0;
    const maxVal = parseFloat(max) || Infinity;

    // Konversi ke MB untuk perbandingan (asumsi MB sebagai unit dasar)
    const minValInMB = unit === "gb" ? minVal * 1024 : minVal;
    const maxValInMB = unit === "gb" ? maxVal * 1024 : maxVal;

    if (minValInMB > maxValInMB && max !== "") { // Hanya alert jika max diisi
        setNotification("Minimum value cannot exceed maximum value.");
        return;
    }

    setFilters((prev) => ({
      ...prev,
      size: { min, max, unit },
    }));
    setNotification("Size filter applied!");
  };

  const handleResetSizeFilter = () => {
    setSizeInput({ min: "", unit: "gb", max: "" });
    setFilters((prev) => ({
      ...prev,
      size: { min: "", max: "", unit: "gb" },
    }));
    setNotification("Size filter reset!");
  };

  const handleApplyDateFilter = () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateAdded: {
        start: dateInput.startDate, // Menggunakan startDate
        end: dateInput.endDate, // Menggunakan endDate
      },
    }));
    setNotification("Date filter applied!");
  };

  const handleResetDateFilter = () => {
    setDateInput({ startDate: "", endDate: "" }); // Menggunakan startDate, endDate
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateAdded: { start: "", end: "" },
    }));
    setNotification("Date filter reset!");
  };

  // Menambahkan platform dan location ke keys untuk Fuse.js
  const fuse = new Fuse(gamesData, {
    keys: ["name", "description", "genre", "status", "size", "platform", "location"],
    threshold: 0.3,
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredAndSearchedData = gamesData.filter((game) => {
    // Mengganti game.category menjadi game.genre
    const gameGenres = game.genre && Array.isArray(game.genre) ? game.genre : [];

    const matchesGenre =
      filters.genre.length > 0
        ? gameGenres.some((gen) => filters.genre.includes(gen)) // Mengganti 'cat'/'category' menjadi 'gen'/'genre'
        : true;

    const matchesStatus = filters.status ? game.status === filters.status : true;

    const matchesSize = (() => {
      if (!filters.size?.min && !filters.size?.max) return true;

      const parseGameSize = (sizeString) => {
        if (!sizeString) return 0; // Menangani kasus jika sizeString kosong/null
        const parts = sizeString.split(" ");
        const value = parseFloat(parts[0]);
        const unit = parts[1]?.toLowerCase();
        if (isNaN(value)) return 0; // Tambah validasi untuk memastikan value adalah angka
        if (unit === "gb") return value * 1024; // Konversi ukuran game ke MB
        return value; // Asumsi MB jika tidak ditentukan atau memang MB
      };

      const gameSizeInMB = parseGameSize(game.size);

      // Konversi filter min/max ke MB berdasarkan unit yang dipilih di filter
      const filterMinInMB = filters.size.min
        ? (filters.size.unit === "gb" ? parseFloat(filters.size.min) * 1024 : parseFloat(filters.size.min))
        : 0;

      const filterMaxInMB = filters.size.max
        ? (filters.size.unit === "gb" ? parseFloat(filters.size.max) * 1024 : parseFloat(filters.size.max))
        : Infinity; // Gunakan Infinity jika max kosong

      return gameSizeInMB >= filterMinInMB && gameSizeInMB <= filterMaxInMB;
    })();

    // Filter berdasarkan Date Added
    const matchesDateAdded = (() => {
      if (!filters.dateAdded.start && !filters.dateAdded.end) return true;

      // Pastikan game.dateAdded adalah objek Timestamp dari Firestore
      // Jika game.dateAdded adalah objek Date biasa, sesuaikan
      const itemDate = game.dateAdded && typeof game.dateAdded.toDate === 'function' ? game.dateAdded.toDate() : (game.dateAdded ? new Date(game.dateAdded) : null);
      if (!itemDate) return true; // Lewati filter jika tanggal tidak valid

      const startDate = filters.dateAdded.start ? new Date(filters.dateAdded.start) : null;
      const endDate = filters.dateAdded.end ? new Date(filters.dateAdded.end) : null;

      // Set waktu ke tengah malam untuk hanya membandingkan tanggal
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999); // Set waktu akhir ke akhir hari

      return (
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate)
      );
    })();

    const matchesSearch = searchQuery.trim() === ''
      ? true
      : fuse.search(searchQuery).some((result) => result.item.id === game.id);

    return matchesGenre && matchesStatus && matchesSize && matchesDateAdded && matchesSearch;
  });

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  const sortedData = [...filteredAndSearchedData].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle date sorting specifically
      if (sortConfig.key === 'dateAdded') {
          const dateA = aValue && typeof aValue.toDate === 'function' ? aValue.toDate().getTime() : new Date(aValue).getTime();
          const dateB = bValue && typeof bValue.toDate === 'function' ? bValue.toDate().getTime() : new Date(bValue).getTime();
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
      }
      
      // Default string/number comparison
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredAndSearchedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const renderActiveFilter = () => {
    switch (activeFilterTab) {
      case "genre": // Mengganti "category" ke "genre"
        return (
          <FilterGenre // Mengganti FilterCategory
            genres={genres} // Mengganti categories
            selectedGenres={filters.genre} // Mengganti selectedCategories
            onChange={handleGenreChange} // Mengganti handleCategoryChange
          />
        );
      case "status":
        return (
          <FilterStatus
            statuses={statuses}
            selectedStatus={filters.status}
            // Mengganti e, "status" menjadi langsung nilai yang dipilih
            onChange={(value) => handleFilterChange("status", value)} 
          />
        );
      case "size":
        return (
          <FilterSize
            sizeInput={sizeInput}
            onApply={handleApplySizeFilter}
            onReset={handleResetSizeFilter}
            onInputChange={(key, value) =>
              setSizeInput((prev) => ({ ...prev, [key]: value }))
            }
          />
        );
      case "dateAdded":
        return (
          <FilterDate
            dateInput={dateInput}
            onApply={handleApplyDateFilter}
            onReset={handleResetDateFilter}
            onInputChange={(key, value) =>
              setDateInput((prev) => ({ ...prev, [key]: value }))
            }
          />
        );
      default:
        return null;
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected game(s)?`)) {
      try {
        for (let id of selectedRows) {
          await deleteGame(id);
        }
        setGamesData((prevGames) => prevGames.filter((game) => !selectedRows.includes(game.id)));
        setSelectedRows([]);
        setNotification("Selected games deleted successfully!"); // Notifikasi sukses
      } catch (error) {
        console.error("Error deleting games:", error);
        setNotification("Error deleting games. Please try again."); // Notifikasi error
      }
    }
  };

  const handleEdit = async () => {
    if (selectedRows.length === 1) {
        try {
            // Hapus baris ini: const gameToEdit = await getGameById(selectedRows[0]);
            // EditGameModal sudah mengambil datanya sendiri berdasarkan gameId

            setSelectedGameId(selectedRows[0]); // Langsung gunakan ID dari selectedRows
            setIsEditModalOpen(true);
            // Tidak perlu ada setNotification di sini untuk kasus sukses
        } catch (error) {
            // Catch ini mungkin tidak perlu lagi karena tidak ada async operation di sini
            // Namun, jika Anda menambahkan validasi lain yang mungkin async, bisa dipertahankan
            console.error("Error setting game for editing:", error); // Sesuaikan pesan error
            setNotification("Failed to prepare game data for editing.");
        }
    } else if (selectedRows.length > 1) {
        setNotification("Please select only one game to edit.");
    } else {
        setNotification("Please select a game to edit.");
    }
};

  const handleUpdateGame = async (updatedGameData) => {
    try {
      const updatedGame = await updateGame(selectedGameId, updatedGameData);
      setGamesData((prevGames) =>
        prevGames.map((game) => (game.id === updatedGame.id ? updatedGame : game))
      );
      setIsEditModalOpen(false);
      setNotification("Game updated successfully!"); // Notifikasi sukses
    } catch (error) {
      console.error("Error updating game:", error);
      setNotification("Failed to update game. Please try again."); // Notifikasi error
    }
  };

  // Mengatur timeout untuk notifikasi
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Notifikasi akan hilang setelah 5 detik
      return () => clearTimeout(timer); // Bersihkan timer jika komponen unmount atau notifikasi berubah
    }
  }, [notification]);

  return (
    <div className="p-6 space-y-6">
      {/* Notifikasi Toast */}
      {notification && (
        <div 
          className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-fade-in-down"
          role="alert"
        >
          <span className="block">{notification}</span>
          <button 
            onClick={() => setNotification(null)}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg className="fill-current h-5 w-5" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 3.152a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.152 7.348a1.2 1.2 0 0 1 1.697-1.697L10 8.303l2.651-3.152a1.2 1.2 0 1 1 1.697 1.697L11.697 10l3.152 2.651a1.2 1.2 0 0 1 0 1.697z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        title="Games Management"
        onAddNew={handleOpenModal}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Filter Tabs */}
      <FilterTabs
        activeTab={activeFilterTab}
        onTabChange={setActiveFilterTab}
      />

      <div className="mt-4">{renderActiveFilter()}</div>

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onResetAll={handleResetFilters} // Pastikan ActiveFilters punya prop ini
      />

      {/* Section Actions */}
      {selectedRows.length > 0 && (
        <SectionActions
          selectedRows={selectedRows}
          gamesData={gamesData} // GamesData mungkin tidak diperlukan di sini, cek SectionActions
          onClose={closeActions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Table Data */}
      <GameTable
        data={paginatedData}
        selectedRows={selectedRows}
        onRowClick={handleRowClick}
        onSort={handleSort}
        sortConfig={sortConfig}
        onSelectAll={(e) =>
          setSelectedRows(e.target.checked ? paginatedData.map((game) => game.id) : [])
        }
      />

      {/* Add New Game Modal */}
      {isModalOpen && (
        <AddNewGameForm
          onSubmit={handleFormSubmit}
          onClose={handleCloseModal}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedGameId && (
        <EditGameModal
          gameId={selectedGameId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateGame}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

export default GamesPage;