import React, { useState, useEffect } from "react";
import { db, getDocs } from "../../config/firebaseConfig"; 
import { collection } from "firebase/firestore";
import { addGame, deleteGame, getGameById, updateGame } from "../../services/gamesService";
import useGamesData from "../../hooks/useGamesData";
import useFilters from "../../hooks/useFilters";
import Pagination from "../../components/Pagination"; // Import komponen Pagination
import AddNewGameForm from "../../modals/InputModal/AddNewGameForm";
import EditGameModal from "../../modals/EditModal/EditGameModal";
import Header from "./Header";
import FilterTabs from "./FilterTabs";
import ActiveFilters from "./ActiveFilters";
import FilterSize from "./filters/FilterSize";
import FilterStatus from "./filters/FilterStatus";
import FilterCategory from "./filters/FilterCategory";
import FilterDate from "./filters/FilterDate";
import SectionActions from "./SectionActions";
import GameTable from "./GameTable";
import Fuse from "fuse.js";

const GamesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [gamesData, setGamesData] = useState([]); // State untuk menyimpan data game
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeFilterTab, setActiveFilterTab] = useState("category");
  const {filters, setFilters, handleFilterChange, handleResetFilters } = useFilters();  
  const [sizeInput, setSizeInput] = useState({
    min: "",
    unit: "gb", // Default unit
    max: "",
  });
  const [dateInput, setDateInput] = useState({
    start: "",
    end: "",
  });
    
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Menambahkan state untuk rowsPerPage
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);


  const handleFormSubmit = async (newGameData) => {
    console.log("Form submitted with data:", newGameData);
  
    try {
      // Tambahkan game baru menggunakan gamesService
      const newGame = await addGame(newGameData);
  
      // Perbarui state gamesData
      setGamesData((prevGames) => [...prevGames, newGame]);
  
      // Tutup modal setelah berhasil
      handleCloseModal();
    } catch (error) {
      console.error("Error adding new game: ", error);
      alert("Failed to add new game. Please try again.");
    }
  };

  useGamesData(setGamesData)

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);
  
  const [statuses, setStatuses] = useState([]);
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        // Ambil data dari koleksi 'games' di Firestore
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        
        // Mengambil semua status unik dari data games
        const statusSet = new Set(); // Menggunakan Set untuk memastikan status yang unik
        gamesSnapshot.docs.forEach(doc => {
          const gameData = doc.data();
          if (gameData.status) {
            statusSet.add(gameData.status); // Tambahkan status ke Set
          }
        });
  
        // Ubah Set ke array dan simpan ke dalam state
        setStatuses([...statusSet]);
      } catch (error) {
        console.error('Error fetching statuses: ', error);
      }
    };
  
    fetchStatuses();
  }, []); // Hanya dijalankan sekali saat komponen pertama kali dirender

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCollection = collection(db, "categories"); // ganti dengan path koleksi kategori Anda
      const categorySnapshot = await getDocs(categoriesCollection);
      const categoryList = categorySnapshot.docs.map(doc => doc.data().name); // ganti dengan field yang sesuai
      setCategories(categoryList);
    };

    fetchCategories();
  }, []);

  const handleRowClick = (gameId, e) => {
    // Cek apakah tombol CTRL sedang ditekan
    const isCtrlPressed = e.ctrlKey;
  
    if (isCtrlPressed) {
      // Jika CTRL ditekan, toggle pemilihan baris tanpa menghapus pilihan yang ada
      setSelectedRows((prevSelectedRows) => {
        if (prevSelectedRows.includes(gameId)) {
          // Jika baris sudah dipilih, hapus dari selectedRows
          return prevSelectedRows.filter((id) => id !== gameId);
        } else {
          // Jika baris belum dipilih, tambahkan ke selectedRows
          return [...prevSelectedRows, gameId];
        }
      });
    } else {
      // Jika CTRL tidak ditekan, hanya pilih satu baris
      setSelectedRows([gameId]);
      setSelectedGameId(gameId); // Set gameId yang dipilih
    }
  };

  const closeActions = () => {
    setSelectedRows([]);
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFilters((prevFilters) => {
      const newCategories = checked
        ? [...prevFilters.category, value]
        : prevFilters.category.filter((category) => category !== value);
      return { ...prevFilters, category: newCategories };
    });
  };

  const handleRemoveFilter = (filterType, value = null) => {
    setFilters((prevFilters) => {
      if (filterType === "category") {
        return {
          ...prevFilters,
          category: prevFilters.category.filter((cat) => cat !== value),
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
  
    // Validasi: Nilai min tidak boleh melebihi max jika unit GB
    if (unit === "gb" && parseFloat(min) > parseFloat(max)) {
      alert("Minimum value cannot exceed maximum value when using GB unit.");
      return;
    }
  
    // Terapkan filter size
    setFilters((prev) => ({
      ...prev,
      size: { min, max, unit },
    }));
  };
  
  const handleResetSizeFilter = () => {
    // Reset filter size ke kondisi default
    setSizeInput({ min: "", unit: "gb", max: "" });
    setFilters((prev) => ({
      ...prev,
      size: { min: "", max: "", unit: "gb" },
    }));
  };
  
  const handleApplyDateFilter = () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateAdded: {
        start: dateInput.startDate,
        end: dateInput.endDate,
      },
    }));
  };
  
  const handleResetDateFilter = () => {
    setDateInput({ startDate: "", endDate: "" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateAdded: { start: "", end: "" },
    }));
  };
  
  const fuse = new Fuse(gamesData, {
    keys: ["name", "description", "category", "status", "size"],
    threshold: 0.3,
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredAndSearchedData = gamesData.filter((game) => {
const gameCategories = game.category && Array.isArray(game.category) ? game.category : [];

    const matchesCategory =
    filters.category.length > 0
      ? gameCategories.some((cat) => filters.category.includes(cat)) // Menggunakan gameCategories yang sudah dijamin array
      : true;
  
    const matchesStatus = filters.status ? game.status === filters.status : true;
  
    const matchesSize = (() => {
    if (!filters.size?.min && !filters.size?.max) return true;

    const parseSizeWithUnit = (sizeString) => {
      const [value, unit] = sizeString.split(" ");
      return { value: parseFloat(value), unit: unit.toLowerCase() };
    };

    const { value: itemValue, unit: itemUnit } = parseSizeWithUnit(game.size);

    const minValue =
      filters.size.unit === "gb"
        ? parseFloat(filters.size.min || 0) * 1024
        : parseFloat(filters.size.min || 0);

    const maxValue = parseFloat(filters.size?.max || Infinity) * 1024;

    if (itemUnit === "mb") {
      return itemValue >= minValue && itemValue <= maxValue;
    } else if (itemUnit === "gb") {
      return itemValue * 1024 >= minValue && itemValue * 1024 <= maxValue;
    }

    return false;
  })();// Filter berdasarkan Date Added

  const matchesDateAdded = (() => {
    if (!filters.dateAdded.start && !filters.dateAdded.end) return true;
  
    const itemDate = new Date(game.dateAdded.seconds * 1000); // timestamp Firestore
    const startDate = filters.dateAdded.start ? new Date(filters.dateAdded.start) : null;
    const endDate = filters.dateAdded.end ? new Date(filters.dateAdded.end) : null;
  
    // Set waktu ke tengah malam untuk hanya membandingkan tanggal
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999); // Set waktu akhir ke akhir hari
  
    // Bandingkan tanggal tanpa mempertimbangkan waktu
    return (
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate)
    );
  })();
  
  const matchesSearch = searchQuery.trim() === ''
      ? true
      : fuse.search(searchQuery).some((result) => result.item.id === game.id);

  return matchesCategory && matchesStatus && matchesSize && matchesDateAdded && matchesSearch;
});    

  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        // Jika kolom yang sama diurutkan lagi, ubah arah
        return { key, direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      // Jika kolom baru diurutkan, mulai dengan ascending
      return { key, direction: 'ascending' };
    });
  };
  const sortedData = [...filteredAndSearchedData].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Logika untuk pagination
  const totalPages = Math.ceil(filteredAndSearchedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const renderActiveFilter = () => {
    switch (activeFilterTab) {
      case "category":
        return (
          <FilterCategory
            categories={categories}
            selectedCategories={filters.category}
            onChange={handleCategoryChange}
          />
        );
        case "status":
          return (
            <FilterStatus
              statuses={statuses}
              selectedStatus={filters.status}
              onChange={handleFilterChange}
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
    setCurrentPage(1); // Reset ke halaman pertama saat jumlah baris berubah
  };

  // Fungsi untuk menghapus data yang dipilih
  const handleDelete = async () => {
    try {
      for (let id of selectedRows) {
        // Hapus game menggunakan gamesService
        await deleteGame(id);
      }
  
      // Hapus game dari state
      setGamesData((prevGames) => prevGames.filter((game) => !selectedRows.includes(game.id)));
  
      alert("Selected games deleted successfully!");
      setSelectedRows([]); // Reset pemilihan setelah penghapusan
    } catch (error) {
      console.error("Error deleting games:", error);
      alert("Error deleting games. Please try again.");
    }
  };
  

  // Fungsi untuk mengedit data (misalnya, membuka form edit)
  const handleEdit = async () => {
    if (selectedRows.length === 1) {
      try {
        // Ambil data game yang akan diedit
        const gameToEdit = await getGameById(selectedRows[0]);
        console.log("Game to Edit:", gameToEdit); // Debugging
  
        // Simpan ID game yang sedang diedit
        setSelectedGameId(gameToEdit.id);
  
        // Buka modal edit
        setIsEditModalOpen(true);
      } catch (error) {
        console.error("Error fetching game:", error);
        alert("Failed to fetch game data for editing.");
      }
    }
  };
  
  const handleUpdateGame = async (updatedGameData) => {
    try {
      // Perbarui data game di Firestore menggunakan gamesService
      const updatedGame = await updateGame(selectedGameId, updatedGameData);
  
      // Perbarui state gamesData
      setGamesData((prevGames) =>
        prevGames.map((game) => (game.id === updatedGame.id ? updatedGame : game))
      );
  
      // Tutup modal setelah berhasil
      setIsEditModalOpen(false);
  
      // Set notifikasi sukses
      setNotification("Game updated successfully!");
    } catch (error) {
      console.error("Error updating game:", error);
      alert("Failed to update game. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
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
      />

      {/* Section Actions */}
      {selectedRows.length > 0 && (
        <SectionActions
          selectedRows={selectedRows}
          gamesData={gamesData}
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
        onClose={handleCloseModal} />
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