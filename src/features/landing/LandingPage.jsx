import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import {
  Search,
  ArrowDownToLine,
  PlayCircle,
  Wrench,
  HelpCircle,
  MessageCircle,
  FileQuestion,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Gamepad2,
  Play,
  Video,
  ExternalLink,
  Monitor,
  Cpu,
  Archive,
} from 'lucide-react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../../config/firebaseConfig';
import { formatFileSize } from '../games/utils/formatters';
import DownloadsSection from './components/DownloadsSection';
import WhatsAppContactSection from './components/WhatsAppContactSection';
import { tutorials as staticTutorials } from './data/tutorials';
import { faqItems as staticFaqItems } from './data/faq';
import { loadActiveFaqs } from '../feedback/services/feedbackFirestore';
import { prerequisites as staticPrerequisites } from './data/prerequisites';
import {
  tutorialsCRUD,
  prerequisitesCRUD,
} from '../content/services/contentFirestore';

// ─── Env ─────────────────────────────────────────────────────
const STORE_URL =
  import.meta.env.VITE_SHOPEE_STORE_URL || 'https://shopee.co.id/mygameon';
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

// ─── Icon maps ───────────────────────────────────────────────
const prereqIconMap = { monitor: Monitor, cpu: Cpu, archive: Archive };

// ═══════════════════════════════════════════════════════════════
// STICKY NAV
// ═══════════════════════════════════════════════════════════════
const StickyNav = ({ visible }) => (
  <nav
    className={`fixed top-0 inset-x-0 z-50 border-b border-[#2A2F39] bg-[#111317]/90 backdrop-blur-md transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
  >
    <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
      <a href="#" className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-[#FFD100]" />
        <span className="font-bold text-sm text-[#F3F4F6]">MyGameON</span>
      </a>
      <div className="hidden sm:flex items-center gap-1">
        {[
          { label: 'Download', href: '#downloads' },
          { label: 'Game', href: '#catalog' },
          { label: 'Tutorial', to: '/videos' },
          { label: 'FAQ', to: '/faq' },
          { label: 'Kontak', href: '#contact' },
        ].map((item) =>
          item.to ? (
            <Link
              key={item.label}
              to={item.to}
              className="px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors rounded-md hover:bg-[#1A1F27]"
            >
              {item.label}
            </Link>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors rounded-md hover:bg-[#1A1F27]"
            >
              {item.label}
            </a>
          )
        )}
      </div>
      <a
        href={`https://wa.me/${WA_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#FFD100] px-4 py-1.5 text-xs font-bold text-[#111317] hover:brightness-90 transition"
      >
        Hubungi Admin
      </a>
    </div>
  </nav>
);

// ═══════════════════════════════════════════════════════════════
// SECTION DIVIDER
// ═══════════════════════════════════════════════════════════════
const SectionDivider = () => (
  <div className="relative h-16 md:h-20 overflow-hidden">
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,209,0,0.04) 25%, transparent 25%),
          linear-gradient(225deg, rgba(255,209,0,0.04) 25%, transparent 25%),
          linear-gradient(315deg, rgba(255,209,0,0.04) 25%, transparent 25%),
          linear-gradient(45deg, rgba(255,209,0,0.04) 25%, transparent 25%)`,
        backgroundSize: '32px 32px',
        backgroundAttachment: 'fixed',
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#111317] via-transparent to-[#111317]" />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// GAME CATALOG (Firestore + Fuse.js)
// ═══════════════════════════════════════════════════════════════
const FUSE_OPTIONS = {
  keys: ['title', 'tags'],
  threshold: 0.35,
  ignoreLocation: true,
};

const GameCardSkeleton = () => (
  <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-[#2A2F39]" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 bg-[#2A2F39] rounded" />
      <div className="h-3 w-1/2 bg-[#2A2F39] rounded" />
      <div className="h-9 w-full bg-[#2A2F39] rounded-lg mt-3" />
    </div>
  </div>
);

const DarkGameCard = ({ game }) => {
  const title = game.title || 'Untitled';
  const coverSrc =
    game.coverImageUrl ||
    'https://via.placeholder.com/600x450/1a1f27/FFD100?text=MyGameON';
  const shopeeUrl = game.shopee?.url || STORE_URL;
  const sizeDisplay = game.fileSizeBytes
    ? formatFileSize(game.fileSizeBytes)
    : null;
  const genre =
    Array.isArray(game.genres) && game.genres[0]
      ? game.genres[0].charAt(0).toUpperCase() + game.genres[0].slice(1)
      : null;

  const waMsg = encodeURIComponent(
    `Halo, saya tertarik dengan game "${title}". Apakah masih tersedia?`
  );

  return (
    <div className="group flex flex-col rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden hover:border-[#FFD100]/30 transition-all duration-200">
      <div className="relative aspect-[4/3] bg-[#0D1117] overflow-hidden">
        <LazyLoadImage
          src={coverSrc}
          alt={title}
          effect="blur"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        />
        {genre && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#111317]/80 text-[#C8CFDA] backdrop-blur-sm border border-[#2A2F39]">
            {genre}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h4
          className="font-bold text-sm text-[#F3F4F6] leading-snug truncate"
          title={title}
        >
          {title}
        </h4>
        {sizeDisplay && (
          <span className="text-[11px] text-[#7E8796] mt-1">{sizeDisplay}</span>
        )}
        <div className="mt-auto pt-3 flex gap-1.5">
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Shopee
          </a>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Chat WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

const GameCatalogSection = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const fuseRef = useRef(null);
  const PER_PAGE = 8;

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const q = query(
          collection(db, 'games'),
          where('availabilityStatus', '==', 'available'),
          where('isProblematic', '==', false)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setGames(data);
        fuseRef.current = new Fuse(data, FUSE_OPTIONS);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const filtered = searchTerm.trim()
    ? (fuseRef.current?.search(searchTerm) || []).map((r) => r.item)
    : games;

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  }, []);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#F3F4F6]">
            Katalog Game
          </h2>
          <p className="text-[#9CA3AF] mt-1 text-sm">
            {games.length > 0
              ? `${games.length} game tersedia.`
              : 'Memuat katalog...'}{' '}
            Belum ada?{' '}
            <Link
              to="/request-game"
              className="text-[#FFD100] hover:underline font-medium"
            >
              Kirim request
            </Link>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7E8796]" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Cari judul game..."
          className="w-full rounded-xl border border-[#2F3643] bg-[#1A1F27] text-[#F3F4F6] pl-12 pr-4 py-3.5 text-sm placeholder:text-[#7E8796] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/40 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setPage(0);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7E8796] hover:text-[#F3F4F6] text-xs font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : paged.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paged.map((game) => (
            <DarkGameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-[#7E8796] opacity-40" />
          <p className="text-[#9CA3AF] font-medium">
            {searchTerm
              ? `Tidak ada hasil untuk "${searchTerm}".`
              : 'Belum ada game di katalog.'}
          </p>
          {searchTerm && (
            <div className="mt-4 flex gap-3 justify-center">
              <Link
                to="/request-game"
                className="inline-block bg-[#FFD100] text-[#111317] px-5 py-2.5 rounded-lg hover:brightness-95 transition-all font-semibold text-sm"
              >
                Request Game Ini
              </Link>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                className="inline-block border border-[#2F3643] text-[#C8CFDA] px-5 py-2.5 rounded-lg hover:bg-[#1A1F27] transition-all font-semibold text-sm"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-8">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-lg border border-[#2F3643] text-[#C8CFDA] hover:bg-[#1A1F27] transition-colors disabled:opacity-30 disabled:pointer-events-none grid place-items-center"
            aria-label="Halaman sebelumnya"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 4L6 8l4 4" />
            </svg>
          </button>

          {/* Page numbers with ellipsis */}
          {(() => {
            const items = [];
            const show = new Set([0, totalPages - 1]);
            for (
              let i = Math.max(0, page - 1);
              i <= Math.min(totalPages - 1, page + 1);
              i++
            )
              show.add(i);
            let prev = -1;
            for (const i of [...show].sort((a, b) => a - b)) {
              if (prev !== -1 && i - prev > 1) {
                items.push(
                  <span
                    key={`e${i}`}
                    className="w-9 h-9 grid place-items-center text-xs text-[#7E8796] select-none"
                  >
                    &hellip;
                  </span>
                );
              }
              items.push(
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === i
                      ? 'bg-[#FFD100] text-[#111317]'
                      : 'border border-[#2F3643] text-[#C8CFDA] hover:bg-[#1A1F27]'
                  }`}
                >
                  {i + 1}
                </button>
              );
              prev = i;
            }
            return items;
          })()}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-9 h-9 rounded-lg border border-[#2F3643] text-[#C8CFDA] hover:bg-[#1A1F27] transition-colors disabled:opacity-30 disabled:pointer-events-none grid place-items-center"
            aria-label="Halaman berikutnya"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// VIDEO PREVIEW (2 featured → /videos)
// ═══════════════════════════════════════════════════════════════
const VideoPreview = () => {
  const [tutorials, setTutorials] = useState(staticTutorials);
  useEffect(() => {
    tutorialsCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setTutorials(items);
      })
      .catch(() => {});
  }, []);
  const featured = tutorials.slice(0, 2);
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#F3F4F6]">
            Video Tutorial
          </h2>
          <p className="text-[#9CA3AF] mt-1 text-sm">
            Panduan langkah demi langkah untuk install game.
          </p>
        </div>
        <Link
          to="/videos"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD100] hover:underline"
        >
          Lihat Semua
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {featured.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden hover:border-[#FFD100]/20 transition-colors"
          >
            <div className="relative aspect-video bg-[#0D1117] grid place-items-center">
              {t.youtubeId ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
                    alt={t.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                    loading="lazy"
                  />
                  <div className="relative z-10 w-14 h-14 rounded-full bg-[#FFD100] grid place-items-center shadow-lg shadow-[#FFD100]/20">
                    <Play className="w-6 h-6 text-[#111317] ml-0.5" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#7E8796]">
                  <Video className="w-10 h-10 opacity-40" />
                  <span className="text-xs font-medium">
                    Video segera hadir
                  </span>
                </div>
              )}
            </div>
            <div className="p-5">
              <h4 className="font-bold text-[#F3F4F6]">{t.title}</h4>
              <p className="mt-1 text-sm text-[#9CA3AF]">{t.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center sm:hidden">
        <Link
          to="/videos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD100] hover:underline"
        >
          Lihat Semua Video
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// PREREQUISITES (3 items)
// ═══════════════════════════════════════════════════════════════
const PrereqSection = () => {
  const [prerequisites, setPrerequisites] = useState(staticPrerequisites);
  useEffect(() => {
    prerequisitesCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setPrerequisites(items);
      })
      .catch(() => {});
  }, []);
  return (
    <section id="software" className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F3F4F6]">
          Software Pendukung
        </h2>
        <p className="text-[#9CA3AF] mt-1 text-sm">
          Install software ini sebelum menjalankan game.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {prerequisites.map((item) => {
          const Icon = prereqIconMap[item.icon] || Wrench;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-5 hover:border-[#FFD100]/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg border border-[#2F3643] bg-[#111317] grid place-items-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#C8CFDA]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#F3F4F6]">
                  {item.name}
                </h4>
                <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-[#7E8796] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// FAQ PREVIEW (3 items → /faq)
// ═══════════════════════════════════════════════════════════════
const FaqPreview = () => {
  const [faqItems, setFaqItems] = useState(staticFaqItems);
  useEffect(() => {
    loadActiveFaqs()
      .then((items) => {
        if (items.length > 0) setFaqItems(items);
      })
      .catch(() => {});
  }, []);
  const topFaq = faqItems.slice(0, 3);
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#F3F4F6]">
            Pertanyaan Umum
          </h2>
          <p className="text-[#9CA3AF] mt-1 text-sm">
            Jawaban cepat untuk pertanyaan yang sering ditanyakan.
          </p>
        </div>
        <Link
          to="/faq"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD100] hover:underline"
        >
          Lihat Semua FAQ
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {topFaq.map((item, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <div
                className={`rounded-xl border transition-colors ${
                  open
                    ? 'border-[#FFD100]/30 bg-[#1A1F27]'
                    : 'border-[#2A2F39] bg-[#1A1F27]/60 hover:bg-[#1A1F27]'
                }`}
              >
                <DisclosureButton className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-semibold text-[#F3F4F6] pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-5 pb-4 text-sm text-[#C8CFDA] leading-relaxed">
                  {item.answer}
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
      <div className="mt-6 text-center sm:hidden">
        <Link
          to="/faq"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FFD100] hover:underline"
        >
          Lihat Semua FAQ
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCROLL TO TOP
// ═══════════════════════════════════════════════════════════════
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#FFD100] text-[#111317] grid place-items-center shadow-lg hover:brightness-90 transition-all hover:scale-105"
      aria-label="Scroll ke atas"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUICK NAV DATA
// ═══════════════════════════════════════════════════════════════
const quickNavItems = [
  { icon: Search, label: 'Cari Game', href: '#catalog', color: '#FFD100' },
  {
    icon: ArrowDownToLine,
    label: 'Download App',
    href: '#downloads',
    color: '#3B82F6',
  },
  {
    icon: PlayCircle,
    label: 'Video Tutorial',
    href: '/videos',
    color: '#A855F7',
    isRoute: true,
  },
  { icon: Wrench, label: 'Software', href: '#software', color: '#F97316' },
  {
    icon: HelpCircle,
    label: 'FAQ',
    href: '/faq',
    color: '#14B8A6',
    isRoute: true,
  },
  {
    icon: MessageCircle,
    label: 'Hubungi Admin',
    href: '#contact',
    color: '#22C55E',
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const LandingPage = () => {
  const [navVisible, setNavVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setNavVisible(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6] scroll-smooth">
      <StickyNav visible={navVisible} />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#2A2F39]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(rgba(255,209,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,209,0,0.07) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,209,0,0.12),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.04),transparent_30%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20 w-full">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
            <p className="inline-flex items-center rounded-full border border-[#FFD100]/25 bg-[#FFD100]/[0.08] px-4 py-1.5 text-[11px] font-semibold tracking-widest text-[#FFD100] mb-6 uppercase">
              Gamer Street &bull; MyGameON
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
              Semua yang Kamu Butuhkan,{' '}
              <span className="text-[#FFD100]">Satu Tempat.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#C8CFDA] max-w-2xl mx-auto leading-relaxed">
              Cari game, download launcher, tonton tutorial, atau langsung
              hubungi admin. Semuanya ada di sini.
            </p>
          </div>

          {/* Quick Nav */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {quickNavItems.map(
              ({ icon: Icon, label, href, color, isRoute }) => {
                const cls =
                  'group flex flex-col items-center gap-2.5 rounded-xl border border-[#2A2F39] bg-[#1A1F27]/70 backdrop-blur-sm px-3 py-4 hover:border-[#FFD100]/40 hover:bg-[#1A1F27] transition-all duration-200';
                const inner = (
                  <>
                    <div
                      className="w-10 h-10 rounded-lg grid place-items-center transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${color}12`,
                        border: `1px solid ${color}35`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-xs font-semibold text-[#C8CFDA] group-hover:text-[#F3F4F6] text-center transition-colors">
                      {label}
                    </span>
                  </>
                );
                return isRoute ? (
                  <Link key={href} to={href} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <a key={href} href={href} className={cls}>
                    {inner}
                  </a>
                );
              }
            )}
          </div>

          {/* Secondary actions */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/request-game"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2F3643] bg-[#1A1F27] px-4 py-2 text-sm font-semibold text-[#C8CFDA] hover:border-[#FFD100]/40 hover:text-[#F3F4F6] transition"
            >
              <FileQuestion className="w-4 h-4" />
              Request Game
            </Link>
            <Link
              to="/request-status"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2F3643] bg-[#1A1F27] px-4 py-2 text-sm font-semibold text-[#C8CFDA] hover:border-[#FFD100]/40 hover:text-[#F3F4F6] transition"
            >
              <ClipboardCheck className="w-4 h-4" />
              Cek Status Request
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#7E8796] animate-bounce">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* ── DOWNLOADS ── */}
      <DownloadsSection />
      <SectionDivider />

      {/* ── GAME CATALOG ── */}
      <GameCatalogSection />
      <SectionDivider />

      {/* ── VIDEO PREVIEW ── */}
      <VideoPreview />

      {/* ── SOFTWARE ── */}
      <PrereqSection />
      <SectionDivider />

      {/* ── FAQ PREVIEW ── */}
      <FaqPreview />

      {/* ── CONTACT ── */}
      <WhatsAppContactSection />

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#2A2F39] text-[#7E8796] py-8 px-6 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.
          </p>
          <Link
            to="/login"
            className="text-[#7E8796]/60 hover:text-[#9CA3AF] transition-colors text-xs"
          >
            Admin
          </Link>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
};

export default LandingPage;
