// src/features/games/GamesPage.jsx
//
// Admin Games Catalog Page
// Refactored: Apr 28, 2026
//
// Architecture:
//   - Pure presentation: hampir semua logic di-extract ke hooks/utils/components
//   - Schema baru langsung dipakai (no more normalizeGameData)
//   - Real-time fetch dari games/ + gamesPrivate/ via useGamesData
//   - Genre filter dari metadata via useMetadataGenres
//
// Features preserved:
//   - List, search, filter, sort, pagination
//   - Multi-select bulk actions (delete, status change)
//   - Add/Edit/Import via modals (NOT touched in this refactor)
//   - Update Versi via Task (modal NOT touched)
//   - Mobile card + Desktop table views
//   - Shopee link button + copy
//
// Features removed:
//   - normalizeGameData (no longer needed)
//   - handleExportSchemaAudit (cleanup tool, not needed post-migration)
//   - Hardcoded genre dropdown (now dynamic from metadata)
//   - Inline format helpers (moved to utils/formatters)
//   - title_lower duplication (Algolia handles)
//   - Multi-status options (now: available / unavailable only)

import React, { useEffect, useMemo, useState } from 'react';
import {
  writeBatch,
  doc,
  serverTimestamp,
  addDoc,
  updateDoc,
  collection,
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Loader2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Upload,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HardDrive,
  RefreshCw,
  Calendar,
  Disc,
} from 'lucide-react';
import Swal from 'sweetalert2';

import GameFormModal from './components/GameFormModal';
import BulkGameImportModal from './components/BulkGameImportModal';
import TaskFormModal from '../tasks/components/TaskFormModal';

import { useGamesData } from './hooks/useGamesData';
import { useMetadataGenres } from './hooks/useMetadataGenres';
import {
  formatFileSize,
  formatPackageType,
  formatRelativeDate,
  formatAbsoluteDate,
  resolveTimestamp,
} from './utils/formatters';
import StatusBadge from './components/StatusBadge';
import LocationCell from './components/LocationCell';

const STORE_URL = 'https://shopee.co.id/mygameon';
const ITEMS_PER_PAGE = 10;

// ============================================================
// MAIN COMPONENT
// ============================================================

const GamesPage = () => {
  // === DATA (real-time from Firestore) ===
  const { games, loading } = useGamesData();
  const { genres: metadataGenres } = useMetadataGenres();

  // === FILTER & SEARCH STATE ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  // === SORT STATE ===
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);

  // === SELECTION & MODAL STATE ===
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // === TASK MODAL STATE (for "Update Versi") ===
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState(null);

  // ============================================================
  // FILTERING + SORTING (memoized)
  // ============================================================

  const processedGames = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const genreLower = filterGenre.toLowerCase().trim();

    let result = games.filter((game) => {
      // Search: title OR storage location email
      let matchesSearch = !searchLower;
      if (searchLower) {
        const titleMatch = (game.title || '')
          .toLowerCase()
          .includes(searchLower);
        const locationMatch = (game._private?.storageLocations || []).some(
          (loc) => (loc.email || '').toLowerCase().includes(searchLower)
        );
        matchesSearch = titleMatch || locationMatch;
      }

      // Genre: array contains
      const matchesGenre =
        !genreLower ||
        (Array.isArray(game.genres) &&
          game.genres.some((g) => g.toLowerCase() === genreLower));

      return matchesSearch && matchesGenre;
    });

    // Sort
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal, bVal;

        if (
          sortConfig.key === 'createdAt' ||
          sortConfig.key === 'updatedAt' ||
          sortConfig.key === 'lastFileUpdatedAt'
        ) {
          aVal = resolveTimestamp(a[sortConfig.key])?.getTime() || 0;
          bVal = resolveTimestamp(b[sortConfig.key])?.getTime() || 0;
        } else if (sortConfig.key === 'fileSizeBytes') {
          aVal = a.fileSizeBytes || 0;
          bVal = b.fileSizeBytes || 0;
        } else if (sortConfig.key === 'location') {
          // Sort by first storage location email
          aVal = (a._private?.storageLocations?.[0]?.email || '').toLowerCase();
          bVal = (b._private?.storageLocations?.[0]?.email || '').toLowerCase();
        } else {
          aVal = (a[sortConfig.key] ?? '').toString().toLowerCase();
          bVal = (b[sortConfig.key] ?? '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [games, searchTerm, filterGenre, sortConfig]);

  const totalPages = Math.ceil(processedGames.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedGames = processedGames.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGenre]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleOpenAdd = () => {
    setEditingGame(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (game) => {
    setEditingGame(game);
    setIsModalOpen(true);
  };

  const handleSaveGame = async (formData, gameId) => {
    try {
      const dataWithTimestamp = {
        ...formData,
        updatedAt: serverTimestamp(),
      };
      if (gameId) {
        await updateDoc(doc(db, 'games', gameId), dataWithTimestamp);
      } else {
        await addDoc(collection(db, 'games'), {
          ...dataWithTimestamp,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Error saving game:', err);
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  /**
   * Handler "Update Versi" — opens TaskFormModal with prefilled data
   * to create a task for updating game version.
   */
  const handleUpdateVersion = (game, e) => {
    if (e) e.stopPropagation();
    setTaskPrefill({
      title: `Update versi: ${game.title}`,
      gameId: game.id,
      gameTitle: game.title,
      currentVersion: game.fileVersion || '-',
    });
    setIsTaskModalOpen(true);
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedGames.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedGames.map((g) => g.id));
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Hapus ${selectedIds.length} game?`,
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.delete(doc(db, 'games', id));
        batch.delete(doc(db, 'gamesPrivate', id));
      });
      await batch.commit();
      setSelectedIds([]);
      Swal.fire({
        title: 'Berhasil!',
        text: `${selectedIds.length} game telah dihapus.`,
        icon: 'success',
        confirmButtonColor: '#0f172a',
        timer: 1500,
      });
    } catch (err) {
      console.error('Bulk delete error:', err);
      Swal.fire({
        title: 'Gagal Menghapus',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  const handleBulkStatus = async (newStatus) => {
    if (!['available', 'unavailable'].includes(newStatus)) return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) =>
        batch.update(doc(db, 'games', id), {
          availabilityStatus: newStatus,
          updatedAt: serverTimestamp(),
        })
      );
      await batch.commit();
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk status error:', err);
      Swal.fire({
        title: 'Gagal Update Status',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#0f172a',
      });
    }
  };

  const getShopeeLink = (game) => game.shopee?.url || STORE_URL;

  const handleCopyShopeeLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      Swal.fire({
        title: 'Tersalin!',
        text: 'Link Shopee telah disalin ke clipboard.',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // ============================================================
  // SUB-COMPONENTS
  // ============================================================

  const SortableHeader = ({ label, sortKey, width }) => {
    const isActive = sortConfig.key === sortKey;
    const Icon = !isActive
      ? ArrowUpDown
      : sortConfig.direction === 'asc'
        ? ArrowUp
        : ArrowDown;
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className={`p-4 text-xs font-bold uppercase tracking-wider cursor-pointer select-none transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
        } ${width || ''}`}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <Icon size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
        </div>
      </th>
    );
  };

  const MobileGameCard = ({ game }) => {
    const isSelected = selectedIds.includes(game.id);

    return (
      <div
        onClick={() => handleOpenEdit(game)}
        className={`bg-white p-4 rounded-xl border ${
          isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'
        } shadow-sm relative active:scale-[0.98] transition-all`}
      >
        {/* Checkbox */}
        <div
          className="absolute top-3 right-3 z-10 p-2 -m-2"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelection(game.id);
          }}
        >
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={isSelected}
            readOnly
          />
        </div>

        {/* Title + badges */}
        <div className="pr-8 mb-2">
          <h3 className="font-bold text-slate-800 text-lg leading-snug mb-1">
            {game.title}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge game={game} />
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                game.shopee?.url
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {game.shopee?.url ? 'Shopee Set' : 'Shopee Missing'}
            </span>
            {game.fileVersion && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium flex items-center">
                <Tag size={10} className="mr-1 opacity-50" /> {game.fileVersion}
              </span>
            )}
            <button
              onClick={(e) => handleUpdateVersion(game, e)}
              className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200 font-bold flex items-center active:bg-purple-100"
            >
              <RefreshCw size={10} className="mr-1" /> Update
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 mt-2">
          <div className="flex items-center">
            <HardDrive size={12} className="mr-2 text-slate-400" />
            <span className="font-mono font-medium">
              {formatFileSize(game.fileSizeBytes)}
            </span>
          </div>

          <div className="flex items-center">
            {game.partsCount > 1 ? (
              <>
                <Layers size={12} className="mr-2 text-slate-400" />
                <span>{game.partsCount} Parts</span>
              </>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>

          <div className="col-span-2 flex items-center">
            <LocationCell game={game} />
          </div>

          <div className="col-span-2 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
            {game.packageType ? (
              <div className="flex items-center text-slate-500">
                <Disc size={12} className="mr-1.5 text-purple-400" />
                {formatPackageType(game.packageType)}
              </div>
            ) : (
              <span></span>
            )}
            <div className="flex items-center">
              <Calendar size={12} className="mr-1.5" />
              {formatRelativeDate(game.updatedAt || game.createdAt)}
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <button
              className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                window.open(getShopeeLink(game), '_blank');
              }}
            >
              Shopee
            </button>
            <button
              className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyShopeeLink(getShopeeLink(game));
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Katalog Game PC
            </h1>
            <p className="text-slate-500 text-sm">
              Total {games.length} game dalam inventaris.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition-all active:scale-95 text-sm"
            >
              <Upload size={16} className="mr-2" /> Import CSV
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg transition-all active:scale-95 text-sm"
            >
              <Plus size={16} className="mr-2" /> Tambah
            </button>
          </div>
        </div>

        {/* FILTERS + BULK ACTIONS BAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari judul, lokasi akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none cursor-pointer hover:bg-slate-50 appearance-none"
              >
                <option value="">Semua Genre</option>
                {metadataGenres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
              <span className="text-sm font-bold text-slate-700 mr-2">
                {selectedIds.length} Dipilih
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatus(e.target.value);
                  e.target.value = '';
                }}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 cursor-pointer flex-grow lg:flex-grow-0"
                defaultValue=""
              >
                <option value="" disabled>
                  Ubah Status...
                </option>
                <option value="available">Set Available</option>
                <option value="unavailable">Set Unavailable</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                title="Hapus Terpilih"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* TABLE / CARDS */}
        <div className="flex flex-col min-h-[400px]">
          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : processedGames.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                Tidak ada game ditemukan.
              </div>
            ) : (
              displayedGames.map((game) => (
                <MobileGameCard key={game.id} game={game} />
              ))
            )}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-col flex-grow group/table">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={
                          selectedIds.length === displayedGames.length &&
                          displayedGames.length > 0
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <SortableHeader
                      label="Nama Game"
                      sortKey="title"
                      width="w-1/3"
                    />
                    <SortableHeader
                      label="Size"
                      sortKey="fileSizeBytes"
                      width="w-24"
                    />
                    <SortableHeader
                      label="Status"
                      sortKey="availabilityStatus"
                      width="w-32"
                    />
                    <SortableHeader
                      label="Updated"
                      sortKey="updatedAt"
                      width="w-36"
                    />
                    <SortableHeader
                      label="Location"
                      sortKey="location"
                      width="w-1/4"
                    />
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Info File
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-500" />
                      </td>
                    </tr>
                  ) : processedGames.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-500"
                      >
                        Tidak ada game ditemukan.
                      </td>
                    </tr>
                  ) : (
                    displayedGames.map((game) => (
                      <tr
                        key={game.id}
                        className={`group hover:bg-slate-50 transition-colors cursor-pointer ${
                          selectedIds.includes(game.id) ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleOpenEdit(game)}
                      >
                        {/* Checkbox */}
                        <td
                          className="p-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(game.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedIds.includes(game.id)}
                            readOnly
                          />
                        </td>

                        {/* Title + version + Shopee badge */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {game.title}
                          </div>
                          {game.fileVersion && (
                            <div className="flex items-center mt-1">
                              <Tag size={10} className="mr-1 text-slate-400" />
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                {game.fileVersion}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                                game.shopee?.url
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {game.shopee?.url
                                ? 'Shopee Set'
                                : 'Shopee Missing'}
                            </span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="p-4">
                          <div className="text-sm text-slate-600 font-mono whitespace-nowrap">
                            {formatFileSize(game.fileSizeBytes)}
                          </div>
                          {game.partsCount > 1 && (
                            <div className="flex items-center mt-1 text-[10px] text-slate-400 font-medium">
                              <Layers size={10} className="mr-1" />{' '}
                              {game.partsCount} Parts
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <StatusBadge game={game} />
                        </td>

                        {/* Updated */}
                        <td className="p-4">
                          <div
                            className="text-xs text-slate-600"
                            title={formatAbsoluteDate(
                              game.updatedAt || game.createdAt
                            )}
                          >
                            {formatRelativeDate(
                              game.updatedAt || game.createdAt
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-4">
                          <LocationCell game={game} />
                        </td>

                        {/* Info File */}
                        <td className="p-4 text-xs text-slate-500 relative">
                          <div>
                            {game.packageType && (
                              <div className="flex items-center mb-1 text-slate-700 font-medium">
                                <Disc
                                  size={12}
                                  className="mr-1 text-purple-500"
                                />
                                {formatPackageType(game.packageType)}
                              </div>
                            )}
                            <div className="flex items-center opacity-70">
                              <Calendar size={12} className="mr-1" />
                              {formatAbsoluteDate(game.lastFileUpdatedAt)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(getShopeeLink(game), '_blank');
                                }}
                              >
                                Shopee
                              </button>
                              <button
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyShopeeLink(getShopeeLink(game));
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Update Versi button (visible on row hover) */}
                          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleUpdateVersion(game, e)}
                              className="p-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold text-xs flex items-center shadow-sm"
                              title="Buat Task Update Versi"
                            >
                              <RefreshCw size={14} className="mr-1" /> Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="mt-4 md:mt-0 border-t border-slate-200 p-4 bg-white md:bg-slate-50 rounded-xl md:rounded-t-none md:rounded-b-xl shadow-sm md:shadow-none border md:border-t-0 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Menampilkan {processedGames.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + ITEMS_PER_PAGE, processedGames.length)}{' '}
              dari {processedGames.length} game
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS (untouched, will be refactored in separate task) */}
      <GameFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingGame}
        onSubmit={handleSaveGame}
        onSuccess={() => {}}
      />

      <BulkGameImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {}}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        prefillData={taskPrefill}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default GamesPage;
