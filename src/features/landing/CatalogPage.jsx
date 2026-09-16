// src/features/landing/CatalogPage.jsx
//
// Halaman Publik Khusus Katalog Lengkap Game PC MyGameON.
// Layout 2 Kolom (Sidebar Sticky di Kiri, Grid Game di Kanan) ala Cyberspace Store.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Loader2, Search, HelpCircle, PlusCircle,
  ArrowLeft, ChevronLeft, ChevronRight, SlidersHorizontal,
  HardDrive, ShieldCheck, X, RotateCcw
} from 'lucide-react';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import LandingNavbar from './components/LandingNavbar';
import GameCardV2 from './components/GameCardV2';
import GameDetailModal from './components/GameDetailModal';
import CatalogSidebar, { GENRE_OPTIONS, SPEC_OPTIONS } from './components/CatalogSidebar';
import CatalogHardwareBanner from './components/CatalogHardwareBanner';
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { evaluateGameCompatibility } from './hooks/useDeviceSpec';
import { db, collection, getDocs, query, where } from '../../config/firebaseConfig';
import { buildWhatsAppUrl } from '../../config/integrations';
import Seo from '../../components/common/Seo';
import Fuse from 'fuse.js';

const ITEMS_PER_PAGE = 20;

const CatalogPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, isConfigured, filterRecommendedOnly, toggleFilterRecommended, checkGame } = useDeviceProfile();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSpec, setSelectedSpec] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync selectedSpec to deviceSpec in localStorage
  const handleSelectSpec = (spec) => {
    setSelectedSpec(spec);
    setDeviceSpec(spec);
  };

  // Fetch all available games from Firestore
  useEffect(() => {
    let isMounted = true;

    async function fetchCatalog() {
      try {
        const gamesRef = collection(db, 'games');
        const q = query(
          gamesRef,
          where('availabilityStatus', '==', 'available'),
          where('isProblematic', '==', false)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty && isMounted) {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGames(list);
        }
      } catch (err) {
        console.warn('Gagal memuat katalog dari Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hitung jumlah game per kategori secara dinamis
  const genreCounts = useMemo(() => {
    const counts = {};
    for (const g of games) {
      const genreStr = Array.isArray(g.genres) ? g.genres.join(' ').toLowerCase() : (g.genre || '').toLowerCase();
      const title = (g.title || g.name || '').toLowerCase();
      if (genreStr.includes('action') || genreStr.includes('aksi') || genreStr.includes('adventure')) counts['action'] = (counts['action'] || 0) + 1;
      if (genreStr.includes('rpg') || genreStr.includes('role-playing')) counts['rpg'] = (counts['rpg'] || 0) + 1;
      if (genreStr.includes('sim') || title.includes('simulator')) counts['simulation'] = (counts['simulation'] || 0) + 1;
      if (genreStr.includes('open world') || title.includes('gta') || title.includes('red dead')) counts['open-world'] = (counts['open-world'] || 0) + 1;
      if (genreStr.includes('indie') || genreStr.includes('casual') || title.includes('stardew')) counts['indie'] = (counts['indie'] || 0) + 1;
      if (genreStr.includes('horror') || title.includes('nightmare') || title.includes('evil')) counts['horror'] = (counts['horror'] || 0) + 1;
      if (genreStr.includes('racing') || genreStr.includes('sport') || title.includes('motogp') || title.includes('speed')) counts['racing'] = (counts['racing'] || 0) + 1;
    }
    return counts;
  }, [games]);

  // Fuse.js client-side search
  const fuseInstance = useMemo(() => {
    return new Fuse(games, {
      keys: [
        { name: 'title', weight: 0.6 },
        { name: 'name', weight: 0.4 },
        { name: 'genres', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [games]);

  // Filtering + Sorting
  const processedGames = useMemo(() => {
    let result = games;

    // 1. Fuzzy search
    if (searchQuery.trim() && fuseInstance) {
      result = fuseInstance.search(searchQuery.trim()).map((res) => res.item);
    }

    // 2. Genre filter
    if (selectedGenre !== 'all') {
      result = result.filter((g) => {
        const genreStr = Array.isArray(g.genres) ? g.genres.join(' ').toLowerCase() : (g.genre || '').toLowerCase();
        const title = (g.title || g.name || '').toLowerCase();
        if (selectedGenre === 'action') return genreStr.includes('action') || genreStr.includes('aksi') || genreStr.includes('adventure');
        if (selectedGenre === 'rpg') return genreStr.includes('rpg') || genreStr.includes('role-playing');
        if (selectedGenre === 'simulation') return genreStr.includes('sim') || title.includes('simulator');
        if (selectedGenre === 'open-world') return genreStr.includes('open world') || title.includes('gta') || title.includes('red dead');
        if (selectedGenre === 'indie') return genreStr.includes('indie') || genreStr.includes('casual') || title.includes('stardew');
        if (selectedGenre === 'horror') return genreStr.includes('horror') || title.includes('nightmare') || title.includes('evil');
        if (selectedGenre === 'racing') return genreStr.includes('racing') || genreStr.includes('sport') || title.includes('motogp') || title.includes('speed');
        return true;
      });
    }

    // 3. Rekomendasi Game untuk Hardware Laptop Saya (Can I Run It)
    if (filterRecommendedOnly && isConfigured) {
      result = result.filter((g) => {
        const res = checkGame(g);
        return res && res.isPlayable;
      });
    }

    // 4. Spec filter (kategori umum)
    if (selectedSpec !== 'all') {
      result = result.filter((g) => {
        const sizeBytes = g.fileSizeBytes || g.size || 0;
        const sizeGB = typeof sizeBytes === 'number' ? sizeBytes / (1024 * 1024 * 1024) : 0;
        const title = (g.title || g.name || '').toLowerCase();
        if (selectedSpec === 'low') return sizeGB < 15 || title.includes('stardew');
        if (selectedSpec === 'mid') return (sizeGB >= 15 && sizeGB < 50) || title.includes('sims');
        if (selectedSpec === 'high') return sizeGB >= 50 || title.includes('cyberpunk') || title.includes('tekken');
        return true;
      });
    }

    // 5. Sorting
    const cloned = [...result];
    if (sortBy === 'size-desc') {
      cloned.sort((a, b) => (b.fileSizeBytes || b.size || 0) - (a.fileSizeBytes || a.size || 0));
    } else if (sortBy === 'size-asc') {
      cloned.sort((a, b) => (a.fileSizeBytes || a.size || 0) - (b.fileSizeBytes || b.size || 0));
    } else if (sortBy === 'name-asc') {
      cloned.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    }

    return cloned;
  }, [games, searchQuery, selectedGenre, selectedSpec, sortBy, fuseInstance, filterRecommendedOnly, isConfigured, checkGame]);

  // Pagination calculation
  const totalPages = Math.ceil(processedGames.length / ITEMS_PER_PAGE) || 1;
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedGames.slice(start, start + ITEMS_PER_PAGE);
  }, [processedGames, currentPage]);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, selectedSpec, sortBy]);

  const activeFiltersCount = (selectedGenre !== 'all' ? 1 : 0) + (selectedSpec !== 'all' ? 1 : 0) + (sortBy !== 'featured' ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setSelectedGenre('all');
    setSelectedSpec('all');
    setSortBy('featured');
    setSearchQuery('');
    toggleFilterRecommended(false);
  };

  const waRequestUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mencari game "${searchQuery || 'tertentu'}" di katalog web tapi belum tersedia. Boleh dibantu cek apakah bisa request link Google Drive-nya min?`,
  });

  const selectedGenreObj = GENRE_OPTIONS.find((g) => g.id === selectedGenre);
  const selectedSpecObj = SPEC_OPTIONS.find((s) => s.id === selectedSpec);

  return (
    <div className="min-h-screen bg-[#030406] text-slate-100 selection:bg-amber-400 selection:text-black font-sans antialiased flex flex-col">
      <Seo
        title="Katalog Lengkap Game PC — MyGameON Store"
        description="Jelajahi ratusan judul game PC siap download kecepatan penuh Google Drive. Pre-installed, anti ribet, bisa order satuan atau paket hemat via WhatsApp."
      />

      {/* Global Navbar */}
      <LandingNavbar />

      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
          <span>/</span>
          <span className="text-white font-semibold">Katalog Game PC</span>
        </div>

        {/* 2-Column Master Layout (ala Cyberspace Store, Elevated) */}
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          
          {/* KOLOM KIRI: Sticky Sidebar Filter */}
          <CatalogSidebar
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
            selectedSpec={selectedSpec}
            onSelectSpec={setSelectedSpec}
            sortBy={sortBy}
            onSelectSort={setSortBy}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            genreCounts={genreCounts}
            totalCount={games.length}
            isMobileOpen={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />

          {/* KOLOM KANAN: Main Catalog Area */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Header Area: Judul, Subtitle & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0E131E] text-slate-300 border border-white/10 text-xs font-medium mb-2">
                  <HardDrive size={13} className="text-emerald-400" />
                  <span>Direct Download Google Drive</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Katalog Game <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">PC</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Menampilkan <span className="text-white font-bold">{processedGames.length}</span> dari {games.length} game siap download kecepatan penuh.
                </p>
              </div>

              {/* Mobile Filter Button Toggle */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#090C12] border border-white/10 text-xs font-bold text-slate-200 hover:text-white hover:border-amber-400/50 transition-colors shadow-sm"
                >
                  <SlidersHorizontal size={15} className="text-amber-400" />
                  <span>Filter & Urutan</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar (Lebar & Modern) */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul game (contoh: GTA, Cyberpunk, Sims, Naruto, Resident Evil, Farming)..."
                className="w-full pl-11 pr-10 py-3.5 bg-[#090C12] border border-white/10 hover:border-white/20 focus:border-amber-400 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all font-medium shadow-lg shadow-black/20"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Can I Run It — Hardware Diagnostic & Profile Banner */}
            <CatalogHardwareBanner
              filterRecommendedOnly={filterRecommendedOnly}
              onToggleFilterRecommended={toggleFilterRecommended}
              className="mb-5"
            />

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap mb-5 text-xs">
                <span className="text-slate-500 font-medium">Filter Aktif:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-medium">
                    <span>Cari: &ldquo;{searchQuery}&rdquo;</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedGenre !== 'all' && selectedGenreObj && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-medium">
                    <span>{selectedGenreObj.label}</span>
                    <button onClick={() => setSelectedGenre('all')} className="hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {selectedSpec !== 'all' && selectedSpecObj && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                    <span>{selectedSpecObj.label}</span>
                    <button onClick={() => handleSelectSpec('all')} className="hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                )}

                {sortBy !== 'featured' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                    <span>Urutkan</span>
                    <button onClick={() => setSortBy('featured')} className="hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold ml-1 cursor-pointer"
                >
                  Reset Semua
                </button>
              </div>
            )}

            {/* Grid List Game Cards */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 size={32} className="animate-spin text-amber-400" />
                <span className="text-xs">Memuat katalog game dari database...</span>
              </div>
            ) : paginatedGames.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                {paginatedGames.map((game) => (
                  <GameCardV2
                    key={game.id}
                    game={game}
                    onSelectGame={setSelectedGame}
                    userSpec={profile?.tier || selectedSpec}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 px-4 bg-[#090C12] border border-white/10 rounded-3xl text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <HelpCircle size={28} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Game Belum Ditemukan
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Game yang Anda cari belum masuk etalase website? Buat tiket request game sekarang atau hubungi admin via WhatsApp untuk kami siapkan link Google Drive-nya.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link
                    to={`/request-game?title=${encodeURIComponent(searchQuery || '')}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 px-5 rounded-xl transition-colors shadow-lg shadow-amber-400/10"
                  >
                    <PlusCircle size={15} className="stroke-[2.5]" />
                    <span>Buat Tiket Request Game</span>
                  </Link>
                  <a
                    href={waRequestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#141A26] hover:bg-white/10 text-slate-300 font-bold text-xs py-3 px-5 rounded-xl border border-white/10 transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-emerald-400 shrink-0" />
                    <span>Chat WA Admin</span>
                  </a>
                </div>
              </div>
            )}

            {/* Paginasi Elegan */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Menampilkan <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-white">{Math.min(currentPage * ITEMS_PER_PAGE, processedGames.length)}</span> dari <span className="font-bold text-white">{processedGames.length}</span> game
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl bg-[#090C12] hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>Sebelumnya</span>
                  </button>

                  {/* Page indicator pill */}
                  <span className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl bg-[#090C12] hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Request Game Banner */}
            <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C101A] to-[#141A26] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Garansi Respon Cepat</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">Tidak Menemukan Game yang Dicari?</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Kami memiliki ratusan judul game lain di server Google Drive yang belum sempat masuk etalase web. Request langsung dengan sistem tiket real-time atau chat admin via WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  to="/request-game"
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/10"
                >
                  <PlusCircle size={15} className="stroke-[2.5]" />
                  <span>Form Request</span>
                </Link>
                <Link
                  to="/request-status"
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                >
                  <Search size={14} />
                  <span>Lacak Tiket</span>
                </Link>
                <a
                  href={waRequestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-3.5 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>WA</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={Boolean(selectedGame)}
        onClose={() => setSelectedGame(null)}
      />

    </div>
  );
};

export default CatalogPage;

