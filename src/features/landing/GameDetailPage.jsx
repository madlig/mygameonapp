// src/features/landing/GameDetailPage.jsx
// Halaman detail game penuh — menggantikan GameDetailModal
// Route: /game/:gameId

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import {
  ArrowLeft,
  HardDrive,
  Cpu,
  CheckCircle2,
  ShoppingBag,
  FolderArchive,
  Clock,
  ChevronRight,
  Loader2,
  PackageOpen,
  QrCode,
  Check,
} from 'lucide-react';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../config/integrations';
import { formatFileSize } from '../games/utils/formatters';
import { getSteamCoverUrl, DEFAULT_STEAM_COVER } from './utils/coverHelper';
import { trackClickShopee, trackClickWhatsApp } from '../../utils/metaPixel';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import CanIRunItBox from './components/CanIRunItBox';
import LandingNavbar from './components/LandingNavbar';
import GameCardV2 from './components/GameCardV2';
import { useDeviceProfile } from './hooks/useDeviceProfile';
import { determineGameRequirement } from './utils/hardwareEngine';
import { useCart } from '../../contexts/CartContext';
import { getGamePriceFormatted } from '../../utils/pricing';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Heuristik spesifikasi minimum & rekomendasi berdasarkan data game.
 * Identik dengan logika di GameDetailModal untuk konsistensi.
 */
function resolveSystemSpecs(game) {
  const rawSize = game.fileSizeBytes || game.size || 0;
  const sizeGB =
    typeof rawSize === 'number' && rawSize > 0 ? rawSize / (1024 * 1024 * 1024) : 20;

  if (game.specs && (game.specs.min || game.specs.minimum)) {
    const min = game.specs.min || game.specs.minimum;
    const rec = game.specs.rec || game.specs.recommended || min;
    return {
      tier: sizeGB < 15 ? 'low' : sizeGB < 50 ? 'mid' : 'high',
      min: {
        os: min.os || 'Windows 10 64-bit',
        cpu: min.cpu || 'Intel Core i3 / AMD Ryzen 3',
        ram: min.ram || '8 GB',
        gpu: min.gpu || 'NVIDIA GTX 750 Ti / AMD RX 550',
        storage: min.storage || `${Math.ceil(sizeGB)} GB`,
      },
      rec: {
        os: rec.os || 'Windows 10 / 11 (64-bit)',
        cpu: rec.cpu || 'Intel Core i5 / AMD Ryzen 5',
        ram: rec.ram || '16 GB RAM',
        gpu: rec.gpu || 'NVIDIA GTX 1060 / AMD RX 580',
        storage: rec.storage || `${Math.ceil(sizeGB + 10)} GB SSD`,
      },
    };
  }

  const req = determineGameRequirement(game);
  if (req) {
    return {
      tier: req.tier || 'mid',
      min: {
        os: 'Windows 10 64-bit',
        cpu: req.minCpu || 'Intel Core i3 / AMD Ryzen 3',
        ram: req.minRam ? `${req.minRam} GB RAM` : '8 GB RAM',
        gpu: req.minGpu || 'NVIDIA GT 1030 / GTX 1050',
        storage: `${Math.ceil(sizeGB)} GB Free Storage`,
      },
      rec: {
        os: 'Windows 10 / 11 (64-bit)',
        cpu: req.recCpu || 'Intel Core i5-8400 / AMD Ryzen 5 2600',
        ram: req.recRam ? `${req.recRam} GB RAM` : '16 GB RAM',
        gpu: req.recGpu || 'NVIDIA GeForce GTX 1650 / GTX 1660',
        storage: `${Math.ceil(sizeGB + 10)} GB SSD`,
      },
    };
  }

  // Fallback berdasarkan ukuran file
  if (sizeGB < 5) {
    return {
      tier: 'low',
      min: { os: 'Windows 7 / 8 / 10', cpu: 'Intel Core i3 / AMD A-Series', ram: '4 GB RAM', gpu: 'Intel HD Graphics / NVIDIA GT 730', storage: `${Math.ceil(sizeGB + 2)} GB` },
      rec: { os: 'Windows 10 (64-bit)', cpu: 'Intel Core i5 / AMD Ryzen 3', ram: '8 GB RAM', gpu: 'NVIDIA GTX 750 Ti / AMD RX 460', storage: `${Math.ceil(sizeGB + 5)} GB SSD` },
    };
  } else if (sizeGB < 25) {
    return {
      tier: 'mid',
      min: { os: 'Windows 10 (64-bit)', cpu: 'Intel Core i3 / Core i5 / AMD Ryzen 3', ram: '8 GB RAM', gpu: 'Intel Iris Xe / NVIDIA GT 1030 / GTX 1050', storage: `${Math.ceil(sizeGB + 5)} GB Free Storage` },
      rec: { os: 'Windows 10 / 11 (64-bit)', cpu: 'Intel Core i5-8400 / AMD Ryzen 5 2600', ram: '16 GB RAM', gpu: 'NVIDIA GeForce GTX 1650 / GTX 1660', storage: `${Math.ceil(sizeGB + 10)} GB SSD` },
    };
  } else if (sizeGB < 60) {
    return {
      tier: 'mid',
      min: { os: 'Windows 10 (64-bit)', cpu: 'Intel Core i5 / AMD Ryzen 5', ram: '8 GB RAM', gpu: 'NVIDIA GTX 1050 / AMD RX 570', storage: `${Math.ceil(sizeGB + 10)} GB Free Storage` },
      rec: { os: 'Windows 10 / 11 (64-bit)', cpu: 'Intel Core i5-8400 / AMD Ryzen 5 2600', ram: '16 GB RAM', gpu: 'NVIDIA GeForce GTX 1660 / RTX 2060', storage: `${Math.ceil(sizeGB + 15)} GB SSD` },
    };
  } else {
    return {
      tier: 'high',
      min: { os: 'Windows 10 / 11 (64-bit)', cpu: 'Intel Core i7-6700K / AMD Ryzen 5 1600X', ram: '8 GB RAM', gpu: 'NVIDIA GTX 1060 / AMD RX 5600 XT', storage: `${Math.ceil(sizeGB + 15)} GB SSD` },
      rec: { os: 'Windows 10 / 11 (64-bit)', cpu: 'Intel Core i7-10700K / AMD Ryzen 7 3700X', ram: '16 GB RAM (Dual Channel)', gpu: 'NVIDIA GeForce RTX 3060 / AMD Radeon RX 6700 XT', storage: `${Math.ceil(sizeGB + 20)} GB High-Speed NVMe SSD` },
    };
  }
}

/** Cek apakah game adalah The Sims 4 atau turunannya */
function isTheSims4(game) {
  const t = (game.title || game.name || '').toLowerCase();
  return t.includes('sims 4') || t.includes('the sims 4');
}

/** Hitung skor kemiripan genre antar dua game (0–N) */
function genreSimilarityScore(game, target) {
  const targetGenres = new Set(
    (Array.isArray(target.genres) ? target.genres : target.genre || []).map((g) => g.toLowerCase())
  );
  const gameGenres = Array.isArray(game.genres) ? game.genres : game.genre || [];
  return gameGenres.filter((g) => targetGenres.has(g.toLowerCase())).length;
}

// ─── Component ──────────────────────────────────────────────────────────────

const GameDetailPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { profile, isConfigured, checkGame } = useDeviceProfile();
  const { addToCart, isInCart, openCart } = useCart();
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  const [game, setGame] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const handleAddToCartOnly = () => {
    if (!game) return;
    addToCart(game, {}, false);
    setJustAddedToCart(true);
    setTimeout(() => setJustAddedToCart(false), 2000);
  };

  // Fetch game detail + semua game untuk related
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    async function fetchData() {
      try {
        // Fetch game yang sedang dilihat
        const gameRef = doc(db, 'games', gameId);
        const snap = await getDoc(gameRef);
        if (!isMounted) return;

        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const gameData = { id: snap.id, ...snap.data() };
        setGame(gameData);

        // Fetch semua game yang tersedia untuk related games
        const q = query(
          collection(db, 'games'),
          where('availabilityStatus', '==', 'available'),
          where('isProblematic', '==', false)
        );
        const catalogSnap = await getDocs(q);
        if (!isMounted) return;
        const catalog = catalogSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllGames(catalog);
      } catch (err) {
        console.error('Gagal memuat detail game:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [gameId]);

  // Scroll to top saat gameId berubah
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [gameId]);

  // Related games: max 6, genre similarity desc, exclude self
  const relatedGames = useMemo(() => {
    if (!game || allGames.length === 0) return [];
    return allGames
      .filter((g) => g.id !== game.id)
      .map((g) => ({ ...g, _score: genreSimilarityScore(g, game) }))
      .filter((g) => g._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);
  }, [game, allGames]);

  // ── Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A10] flex flex-col">
        <LandingNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-400" />
            <span className="text-sm">Memuat detail game…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found State
  if (notFound || !game) {
    return (
      <div className="min-h-screen bg-[#070A10] flex flex-col">
        <LandingNavbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <PackageOpen size={48} className="text-slate-600 mx-auto" />
            <h2 className="text-xl font-bold text-white">Game Tidak Ditemukan</h2>
            <p className="text-sm text-slate-400">Game yang kamu cari tidak tersedia atau sudah dihapus dari katalog.</p>
            <Link
              to="/katalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition-all"
            >
              <ArrowLeft size={16} />
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived Data
  const title = game.title || game.name || 'Detail Game PC';
  const coverUrl = getSteamCoverUrl(game);
  const rawSize = game.fileSizeBytes || game.size || 0;
  const formattedSize =
    typeof rawSize === 'number' && rawSize > 0
      ? formatFileSize(rawSize)
      : typeof rawSize === 'string' && rawSize
      ? rawSize
      : 'Direct Cloud';

  const version = game.fileVersion || game.version || null;
  const packageType = game.packageType || 'PRE-INSTALLED';
  const partsCount = game.partsCount || game.jumlahPart || 1;
  const genres = Array.isArray(game.genres) && game.genres.length > 0
    ? game.genres
    : Array.isArray(game.genre) && game.genre.length > 0
    ? game.genre
    : ['PC Game'];

  const priceFormatted = getGamePriceFormatted(game);
  const shopeeUrl = game.shopee?.url || game.shopeeLink || INTEGRATIONS.shopeeStoreUrl;
  const specs = resolveSystemSpecs(game);
  const diag = isConfigured ? checkGame(game) : null;
  const isSims4 = isTheSims4(game);

  const waOrderUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau order game PC:\n- Judul: ${title}\n- Harga: ${priceFormatted}\n- Ukuran: ${formattedSize}${version ? ` (${version})` : ''}\n- Spek Laptop: ${isConfigured ? `${profile.cpuShort}, ${profile.ramGB}GB RAM, ${profile.gpuShort} (${diag?.isPlayable ? 'Terverifikasi Lancar' : 'Perlu Penyesuaian'})` : 'Belum dicek'}\n- Email Google Drive: [Tulis alamat Gmail kamu di sini]\nMohon info nomor rekening dan total pembayarannya ya min.`,
  });

  const pkgLabel =
    packageType === 'PRE-INSTALLED'
      ? 'Tinggal Ekstrak & Main (Bebas Crack Rumit)'
      : packageType === 'INSTALLER-GOG'
      ? 'Installer GOG (Offline Aktivasi)'
      : packageType === 'INSTALLER-ELAMIGOS' || packageType === 'INSTALLER'
      ? 'Installer (Bebas Corrupt / MD5)'
      : packageType;

  return (
    <div className="min-h-screen bg-[#070A10] text-white">
      <LandingNavbar />

      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-amber-400 transition-colors">Beranda</Link>
          <ChevronRight size={12} />
          <Link to="/katalog" className="hover:text-amber-400 transition-colors">Katalog</Link>
          <ChevronRight size={12} />
          <span className="text-slate-300 line-clamp-1">{title}</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">

        {/* ═══════════════════════════════════════════════════════
            HERO — Cover + Info Utama
        ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pt-6 pb-10 border-b border-white/8">

          {/* Cover */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="aspect-[3/4] w-full max-w-[280px] mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/50 bg-[#141A26] relative">
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = DEFAULT_STEAM_COVER; }}
              />
              {/* Size badge */}
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-amber-400 text-[11px] font-mono font-black px-2.5 py-1 rounded-lg border border-amber-400/20 flex items-center gap-1.5 shadow">
                <HardDrive size={12} className="shrink-0" />
                {formattedSize}
              </div>
              {/* Package type badge */}
              {packageType === 'PRE-INSTALLED' && (
                <div className="absolute bottom-3 left-3 right-3 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/30 text-center">
                  SIAP MAIN
                </div>
              )}
            </div>
          </div>

          {/* Info Utama */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Genre tags + Version */}
            <div className="flex flex-wrap items-center gap-1.5">
              {genres.map((g, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-amber-400 border border-white/10"
                >
                  {g}
                </span>
              ))}
              {version && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {version}
                </span>
              )}
            </div>

            {/* Judul */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              {title}
            </h1>

            {/* Package + Parts + Price Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30">
                <span className="text-xs font-semibold text-slate-400">Harga:</span>
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono tracking-tight">
                  {priceFormatted}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 size={14} />
                <span>{pkgLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-semibold">
                <FolderArchive size={14} className="text-amber-400" />
                <span>{partsCount > 1 ? `${partsCount} Part Download (Bebas Corrupt / MD5)` : '1 File Siap Download'}</span>
              </span>
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-300 leading-relaxed">
              {game.shortDescription ||
                game.description ||
                `${title} untuk PC/Laptop — unduh langsung dari Google Drive kecepatan penuh tanpa shortlink atau iklan menipu. Update dan DLC terlengkap.`}
            </p>

            {/* Can I Run It Box */}
            <CanIRunItBox game={game} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SCREENSHOTS
        ═══════════════════════════════════════════════════════ */}
        {Array.isArray(game.screenshots) && game.screenshots.length > 0 && (
          <div className="py-8 border-b border-white/8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Tangkapan Layar Gameplay Resmi
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {game.screenshots.slice(0, 8).map((shot, idx) => (
                <a
                  key={idx}
                  href={shot}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all block group/shot bg-[#070A0F]"
                >
                  <img
                    src={shot}
                    alt={`${title} screenshot ${idx + 1}`}
                    className="w-full h-full object-cover group-hover/shot:scale-105 transition-transform duration-300"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SYSTEM REQUIREMENTS
        ═══════════════════════════════════════════════════════ */}
        <div className="py-8 border-b border-white/8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
              <Cpu size={20} className="text-amber-400 shrink-0" />
              Kebutuhan Spesifikasi Komputer / Laptop
            </h2>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Pastikan laptop Anda memenuhi spek minimum di bawah
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum */}
            <div className="bg-[#070A0F] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Spesifikasi Minimum</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">Setelan Low 720p</span>
              </div>
              {[
                ['OS', specs.min.os],
                ['Processor', specs.min.cpu],
                ['RAM', specs.min.ram, 'text-amber-400 font-bold'],
                ['Kartu Grafis', specs.min.gpu],
                ['Ruang Simpan', specs.min.storage],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex justify-between gap-4 text-xs py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-slate-500 shrink-0">{label}:</span>
                  <span className={`text-right ${cls || 'text-slate-200'}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Recommended */}
            <div className="bg-[#070A0F] border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Spesifikasi Rekomendasi</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-semibold">Setelan High 1080p 60fps</span>
              </div>
              {[
                ['OS', specs.rec.os],
                ['Processor', specs.rec.cpu],
                ['RAM', specs.rec.ram, 'text-emerald-400 font-bold'],
                ['Kartu Grafis', specs.rec.gpu],
                ['Ruang Simpan', specs.rec.storage],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex justify-between gap-4 text-xs py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-slate-500 shrink-0">{label}:</span>
                  <span className={`text-right ${cls || 'text-slate-200'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            KEUNTUNGAN MEMBELI — dengan copy garansi yang akurat
        ═══════════════════════════════════════════════════════ */}
        <div className="py-8 border-b border-white/8">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
              Keuntungan Membeli di MyGameON:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Link Google Drive Full Speed — Bebas Iklan &amp; Shortlink Menipu</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Video Tutorial Download &amp; Ekstrak Lengkap</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Dipandu Admin WA Sampai Game Berjalan</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Bisa Masuk Paket Bundling Hemat</span>
              </div>
              {/* Garansi akses — disesuaikan per jenis game */}
              {isSims4 ? (
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <Clock size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-amber-400">Akses Selama Toko Aktif</strong> — Kami menjaga
                    akses packs &amp; launcher selama MyGameON beroperasi. Launcher berlaku untuk{' '}
                    <strong className="text-white">1 perangkat</strong>; reinstal dapat dikonsultasikan ke admin.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <Clock size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-400">Akses Download Aktif 1 Tahun</strong> — Link
                    Google Drive tetap aktif selama 1 tahun sejak pembelian. Update atau re-download dalam
                    masa aktif dapat diminta ke admin kapan saja.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RELATED GAMES
        ═══════════════════════════════════════════════════════ */}
        {relatedGames.length > 0 && (
          <div className="py-10 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Game Serupa yang Mungkin Kamu Suka
              </h2>
              <Link
                to="/katalog"
                className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
              >
                Lihat Semua
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {relatedGames.map((g) => (
                <GameCardV2
                  key={g.id}
                  game={g}
                  onSelectGame={(clickedGame) => navigate(`/game/${clickedGame.id}`)}
                />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════
          STICKY BOTTOM CTA
      ═══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#070A10]/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400">
              Beli langsung via Web (QRIS Otomatis) atau checkout di Toko Resmi Shopee &amp; WhatsApp.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* 70 - 30 Split Button Group */}
            <div className="flex items-stretch gap-1.5 flex-1 sm:w-80">
              {/* 70% Beli Sekarang (QRIS) */}
              <button
                type="button"
                onClick={() => isInCart(game?.id) ? openCart() : addToCart(game, {}, true)}
                className="w-[70%] inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-transform active:scale-95 shadow-lg shadow-amber-400/20"
              >
                <QrCode size={16} className="shrink-0" />
                <span className="truncate">
                  {isInCart(game?.id) ? `Buka Keranjang (${priceFormatted})` : `Beli Sekarang (${priceFormatted})`}
                </span>
              </button>

              {/* 30% Masukkan ke Keranjang (Tanpa Buka Modal) */}
              <button
                type="button"
                onClick={handleAddToCartOnly}
                className={`w-[30%] inline-flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all active:scale-95 ${
                  justAddedToCart || isInCart(game?.id)
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                    : 'bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30 text-amber-400 font-bold'
                } text-xs`}
                title={isInCart(game?.id) ? 'Sudah di Keranjang' : 'Masukkan ke Keranjang'}
              >
                {justAddedToCart ? (
                  <>
                    <Check size={15} className="shrink-0" />
                    <span className="hidden xs:inline text-[11px] font-black">Masuk</span>
                  </>
                ) : isInCart(game?.id) ? (
                  <>
                    <Check size={14} className="shrink-0" />
                    <span className="hidden xs:inline text-[11px]">Ada</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} className="shrink-0" />
                    <span className="hidden xs:inline text-[11px]">+ Cart</span>
                  </>
                )}
              </button>
            </div>

            {/* Shopee */}
            <a
              href={shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClickShopee(title)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs sm:text-sm transition-all"
            >
              <ShoppingBag size={15} />
              <span>Shopee</span>
            </a>

            {/* WhatsApp */}
            <a
              href={waOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClickWhatsApp(title)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-colors border border-white/10"
            >
              <WhatsAppIcon className="w-4 h-4 fill-emerald-400 flex-shrink-0" />
              <span>Chat WA</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
