import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Loader2, PlusCircle, HelpCircle, 
  ShieldCheck, ArrowUpRight, ShoppingBag, Gamepad2, Search
} from 'lucide-react';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import LandingNavbar from './components/LandingNavbar';
import SearchHero from './components/SearchHero';
import GameCardV2 from './components/GameCardV2';
import GameDetailModal from './components/GameDetailModal';
import BundlingSection from './components/BundlingSection';
import SimsShowcaseSection from './components/SimsShowcaseSection';
import ToolkitSection from './components/ToolkitSection';
import { db, collection, getDocs, query, where, limit } from '../../config/firebaseConfig';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../config/integrations';
import Seo from '../../components/common/Seo';
import Fuse from 'fuse.js';

// Fallback games in case Firestore is empty or cold start
const FALLBACK_GAMES = [
  {
    id: 'sims4-all',
    title: 'The Sims 4 Complete Edition',
    genres: ['Simulation'],
    fileSizeBytes: 62000000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    price: 25000,
  },
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077: Phantom Liberty',
    genres: ['RPG · Open World'],
    fileSizeBytes: 76000000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    price: 25000,
  },
  {
    id: 'gta-v',
    title: 'Grand Theft Auto V: Enhanced',
    genres: ['Action · Open World'],
    fileSizeBytes: 105000000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    price: 20000,
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring: Shadow of the Erdtree',
    genres: ['Souls-like · RPG'],
    fileSizeBytes: 58000000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    price: 25000,
  },
  {
    id: 'rdr-2',
    title: 'Red Dead Redemption 2',
    genres: ['Action · Adventure'],
    fileSizeBytes: 119000000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80',
    price: 25000,
  },
  {
    id: 'stardew-valley',
    title: 'Stardew Valley 1.6 Expanded',
    genres: ['Cozy · Indie'],
    fileSizeBytes: 1200000000,
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    price: 15000,
  },
];

const LandingPageV2 = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);

  // Fetch games from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
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
        } else if (isMounted) {
          setGames(FALLBACK_GAMES);
        }
      } catch (err) {
        console.warn('Using fallback games due to Firestore error:', err);
        if (isMounted) setGames(FALLBACK_GAMES);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGames();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fuse.js in-memory client-side fuzzy search instance
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

  // Filtered games logic (Fuse search + Hardware spec filter)
  const filteredGames = useMemo(() => {
    let pool = games;

    // Apply fast fuzzy search via Fuse.js if query provided
    if (searchQuery.trim() && fuseInstance) {
      pool = fuseInstance.search(searchQuery.trim()).map((res) => res.item);
    }

    // Apply hardware spec filter
    if (specFilter === 'all') return pool;

    return pool.filter((game) => {
      const title = (game.title || game.name || '').toLowerCase();
      const genres = Array.isArray(game.genres) ? game.genres.join(' ').toLowerCase() : '';
      const sizeBytes = game.fileSizeBytes || game.size || 0;
      const sizeGB = typeof sizeBytes === 'number' ? sizeBytes / (1024 * 1024 * 1024) : 0;

      if (specFilter === 'low') {
        return sizeGB < 15 || title.includes('stardew') || genres.includes('indie');
      }
      if (specFilter === 'mid') {
        return (sizeGB >= 15 && sizeGB < 60) || title.includes('sims') || title.includes('gta');
      }
      if (specFilter === 'high') {
        return sizeGB >= 60 || title.includes('cyberpunk') || title.includes('red dead');
      }

      return true;
    });
  }, [games, searchQuery, specFilter, fuseInstance]);

  const waRequestUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau request game PC yang belum ada di katalog:\n- Judul: ${searchQuery.trim() || '[Tulis judul game]'}\nApakah tersedia link Google Drive-nya min?`,
  });

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 selection:bg-amber-400 selection:text-black flex flex-col justify-between">
      <Seo
        title="MyGameON — Toko Game PC & The Sims 4 Launcher Resmi"
        description="Pusat game PC offline siap download Google Drive full speed tanpa iklan. Tersedia The Sims 4 All DLCs dan paket bundling hemat."
      />

      {/* 1. Header & Navigation */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2. Hero Search-First */}
        <SearchHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeSpecFilter={specFilter}
          onSpecFilterChange={setSpecFilter}
          totalGameCount={games.length > 0 ? games.length : 1200}
        />

        {/* 3. Game Catalog Grid Section */}
        <section className="px-4 sm:px-8 py-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Daftar Game Terkurasi</span>
                <span className="text-xs bg-[#0E121C] text-amber-400 border border-white/10 px-2 py-0.5 rounded-md font-mono">
                  {filteredGames.length} Game
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih game favorit Anda atau ketik di kolom pencarian di atas
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/request-status"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors"
              >
                <Search size={13} className="text-slate-400" />
                <span>Cek Tiket</span>
              </Link>
              <Link
                to="/request-game"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <PlusCircle size={14} className="text-slate-950 stroke-[2.5]" />
                <span>Request Game</span>
              </Link>
            </div>
          </div>

          {/* Grid Layout: 2 cols on mobile, 3 on tablet, 4 on desktop */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 size={32} className="animate-spin text-amber-400" />
              <span className="text-xs">Memuat katalog game MyGameON...</span>
            </div>
          ) : filteredGames.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredGames.slice(0, 8).map((game) => (
                  <GameCardV2 
                    key={game.id} 
                    game={game} 
                    onSelectGame={setSelectedGame}
                    userSpec={specFilter}
                  />
                ))}
              </div>

              {/* High-Converting CTA to Full Catalog Page */}
              <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0C101A] via-[#101522] to-[#0A0D14] border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold uppercase tracking-wider mb-2">
                    <Gamepad2 size={13} className="text-amber-400" />
                    <span>1.200+ Judul Siap Download</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Cari Game PC Lainnya?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    Jelajahi seluruh koleksi game kami lengkap dengan filter spesifikasi device low spek hingga game berat AAA.
                  </p>
                </div>
                <Link
                  to="/katalog"
                  className="shrink-0 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-400/20 active:scale-95"
                >
                  <span>Buka Katalog Lengkap ({games.length > 8 ? `${games.length}+` : '1.200+'} Game)</span>
                  <ArrowUpRight size={18} className="stroke-[2.5]" />
                </Link>
              </div>
            </>
          ) : (
            <div className="py-16 px-4 bg-[#090C12] border border-white/10 rounded-3xl text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Game "{searchQuery}" Belum Ditemukan
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Kami memiliki 1.200+ koleksi game di server Google Drive. Cukup ajukan form request untuk dapatkan tiket antrian atau hubungi admin via WhatsApp!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  to={`/request-game?title=${encodeURIComponent(searchQuery)}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 px-5 rounded-xl transition-colors shadow-lg shadow-amber-400/10"
                >
                  <PlusCircle size={16} className="text-slate-950 stroke-[2.5]" />
                  <span>Ajukan Request Bertiket</span>
                </Link>
                <a
                  href={waRequestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#141A26] hover:bg-white/10 text-slate-300 font-bold text-xs py-3 px-5 rounded-xl border border-white/10 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-400 shrink-0" />
                  <span>Chat Admin via WA</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* 4. Bundling Packages (AOV Booster) */}
        <BundlingSection />

        {/* 5. The Sims 4 Launcher Showcase */}
        <SimsShowcaseSection />

        {/* 6. Essential Gaming Toolkit */}
        <ToolkitSection />

        {/* 7. Shopee Self-Claim Banner Bar */}
        <section className="px-4 sm:px-8 py-10 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider mb-2">
                Portal Mandiri
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Sudah Checkout di Toko Shopee MyGameON?
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Klaim akses Google Drive dan lisensi aktivasi Anda secara mandiri tanpa menunggu balasan chat.
              </p>
            </div>
            <Link
              to="/claim"
              className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-400/20 shrink-0"
            >
              <ShoppingBag size={16} />
              <span>Buka Halaman Klaim Pesanan</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07090E] px-4 sm:px-8 py-8 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-extrabold text-white text-sm mb-1">
              MyGame<span className="text-amber-400">ON</span> Studio
            </div>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} MyGameON. All Rights Reserved. Not affiliated with Electronic Arts or Steam.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs">
            <Link to="/request-game" className="hover:text-amber-400 transition-colors font-medium">Request Game</Link>
            <Link to="/request-status" className="hover:text-slate-300 transition-colors">Lacak Tiket</Link>
            <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
            <Link to="/downloads" className="hover:text-slate-300 transition-colors">Downloads</Link>
            <Link to="/claim" className="hover:text-amber-400 transition-colors font-bold text-amber-400/90">Klaim Shopee</Link>
            <a
              href={`https://wa.me/${INTEGRATIONS.whatsapp.number}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              WhatsApp Toko
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={Boolean(selectedGame)}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
};

export default LandingPageV2;
