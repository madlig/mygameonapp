import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import {
  Search,
  ArrowRight,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  ShoppingCart,
} from 'lucide-react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '../../config/firebaseConfig';
import { formatFileSize } from '../games/utils/formatters';
import { winningProductService } from '../content/services/contentFirestore';
import Seo from '../../components/common/Seo';

// ─── Env ─────────────────────────────────────────────────────
const STORE_URL =
  import.meta.env.VITE_SHOPEE_STORE_URL || 'https://shopee.co.id/mygameon';
const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

// ═══════════════════════════════════════════════════════════════
// FLOATING PILL NAVBAR
// ═══════════════════════════════════════════════════════════════
const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[250] flex justify-center transition-all duration-300"
      style={{ padding: scrolled ? '8px 16px' : '14px 16px' }}
    >
      <div
        className="nav-blur flex w-full items-center justify-between rounded-full transition-all duration-300"
        style={{
          maxWidth: 880,
          background: scrolled ? 'rgba(8,10,14,0.96)' : 'rgba(8,10,14,0.55)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          padding: '8px 10px 8px 14px',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img
            src="/logo.png"
            alt="MyGameON"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-extrabold tracking-tight text-text-primary">
            MyGameON
          </span>
        </Link>

        {/* Nav links */}
        <div className="nav-links flex gap-1">
          {[
            { label: 'Katalog', href: '#catalog' },
            { label: 'Download', to: '/downloads' },
            { label: 'Blog', to: '/blog' },
            { label: 'Tutorial', to: '/videos' },
            { label: 'FAQ', to: '/faq' },
          ].map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-full px-[13px] py-1.5 text-[12.5px] font-medium text-text-dim transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-[13px] py-1.5 text-[12.5px] font-medium text-text-dim transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                {item.label}
              </a>
            )
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border-muted px-3.5 py-1.5 text-xs font-semibold text-text-tertiary transition-colors hover:border-text-ghost hover:text-text-muted"
          >
            Hubungi
          </a>
          <Link
            to="/request-game"
            className="btn-yellow whitespace-nowrap rounded-full bg-accent-yellow px-4 py-[7px] text-xs font-extrabold text-bg-primary no-underline"
          >
            + Request
          </Link>
        </div>
      </div>
    </nav>
  );
};

// ═══════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════
const Hero = () => {
  const parallaxRef = useRef(null);
  useEffect(() => {
    const h = () => {
      if (parallaxRef.current)
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.22}px)`;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ paddingTop: 110, paddingBottom: 60 }}
    >
      {/* Parallax dot grid */}
      <div
        ref={parallaxRef}
        className="dot-grid pointer-events-none absolute"
        style={{ inset: '-30%', willChange: 'transform' }}
      />
      {/* Purple glow */}
      <div
        className="pointer-events-none absolute animate-glow-float rounded-full"
        style={{
          top: '8%',
          left: '-5%',
          width: 480,
          height: 480,
          background: 'rgba(139,92,246,0.18)',
          filter: 'blur(120px)',
        }}
      />
      {/* Yellow glow */}
      <div
        className="pointer-events-none absolute animate-glow-float-slow rounded-full"
        style={{
          bottom: '5%',
          right: '-3%',
          width: 360,
          height: 360,
          background: 'rgba(255,209,0,0.12)',
          filter: 'blur(100px)',
        }}
      />
      {/* Noise */}
      <div className="noise-overlay" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
        <div className="mx-auto max-w-[800px] text-center">
          {/* Eyebrow badge */}
          <div className="hero-stagger-1 mb-8 inline-flex items-center gap-2.5 rounded-full border border-accent-purple/20 bg-accent-purple/[0.08] py-1.5 pl-2 pr-4">
            <span className="rounded-full bg-accent-purple px-2 py-[3px] text-[9px] font-extrabold tracking-[0.5px] text-white">
              BARU
            </span>
            <span className="text-xs font-semibold text-accent-purple-light">
              MyGameON Sims Launcher v10.0.1 tersedia
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hero-stagger-2 mb-6 font-extrabold leading-none tracking-[-2.5px] text-text-primary"
            style={{ fontSize: 'clamp(36px, 5.5vw, 72px)' }}
          >
            Semua Game PC
            <br />
            <span className="bg-gradient-to-br from-accent-yellow to-accent-orange bg-clip-text text-transparent">
              Satu Tempat.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-stagger-3 mx-auto mb-10 max-w-[540px] leading-[1.75] text-text-tertiary"
            style={{ fontSize: 'clamp(14px, 1.3vw, 17px)' }}
          >
            Cari game di katalog, request yang belum tersedia, atau langsung
            hubungi admin. Proses cepat, transparan, tanpa ribet.
          </p>

          {/* CTA row */}
          <div className="hero-stagger-4 mb-10 flex flex-wrap justify-center gap-2.5">
            <a
              href="#catalog"
              className="btn-yellow inline-flex items-center gap-2 rounded-xl bg-accent-yellow px-[26px] py-3.5 text-[15px] font-extrabold text-bg-primary no-underline"
            >
              Cari Game
              <ChevronDown className="h-4 w-4" />
            </a>
            <Link
              to="/request-game"
              className="inline-flex items-center gap-2 rounded-xl border border-accent-purple/25 bg-accent-purple/10 px-[26px] py-3.5 text-[15px] font-bold text-accent-purple-light no-underline transition-all hover:border-accent-purple/45 hover:bg-accent-purple/[0.18]"
            >
              Request Game
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero-stagger-5 flex flex-wrap justify-center gap-2">
            {[
              { n: '500+', l: 'Game Tersedia' },
              { n: '2.4K', l: 'Request Diproses' },
              { n: '5.0', l: 'Rating Shopee' },
            ].map((s) => (
              <div
                key={s.l}
                className="min-w-[120px] rounded-[10px] border border-border-subtle bg-white/[0.03] px-5 py-3 text-center"
              >
                <div className="text-[22px] font-extrabold leading-none tracking-tight text-accent-yellow">
                  {s.n}
                </div>
                <div className="mt-1 text-[10.5px] font-medium text-text-dim">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-b from-transparent to-bg-primary" />
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// WINNING PRODUCT SPOTLIGHT
// ═══════════════════════════════════════════════════════════════
const WINNING_DEFAULT = {
  title: 'Cyberpunk 2077',
  sub: 'Ultimate Edition — Update 2.2',
  genre: 'RPG · Open World · AAA',
  size: '70.8 GB',
  price: 'Rp 25.000',
  oldPrice: 'Rp 45.000',
  tags: ['Bestseller', 'Baru Update'],
  desc: 'Night City menunggumu. Jelajahi kota futuristik dengan grafis ray-tracing, storyline epik, dan ratusan jam gameplay.',
  colors: ['#1a0533', '#3b0764', '#581c87'],
};

const WinningProduct = () => {
  const [hov, setHov] = useState(false);
  const [WINNING, setWinning] = useState(WINNING_DEFAULT);

  useEffect(() => {
    winningProductService
      .load()
      .then((data) => {
        if (data) setWinning(data);
      })
      .catch(() => {});
  }, []);
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-20">
      <div className="mb-7 flex items-center gap-2.5">
        <div className="h-6 w-[3px] rounded-sm bg-accent-yellow" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-[2px] text-accent-yellow">
          Winning Product
        </h2>
      </div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="winning-card cursor-pointer overflow-hidden rounded-[20px] transition-[border-color] duration-300"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          minHeight: 360,
          border: `1px solid ${hov ? 'rgba(139,92,246,0.3)' : '#1A1F27'}`,
          background: '#0D0F14',
        }}
      >
        {/* Visual side */}
        <div
          className="relative flex min-h-[300px] items-center justify-center overflow-hidden"
          style={{
            background: WINNING.coverUrl
              ? `url(${WINNING.coverUrl}) center/cover no-repeat`
              : `linear-gradient(155deg, ${WINNING.colors?.[0] || '#1a0533'}, ${WINNING.colors?.[1] || '#3b0764'}, ${WINNING.colors?.[2] || '#581c87'})`,
          }}
        >
          {!WINNING.coverUrl && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 70%, rgba(139,92,246,0.3) 0%, transparent 60%)',
              }}
            />
          )}
          {/* Dark overlay for readability on images */}
          {WINNING.coverUrl && (
            <div className="pointer-events-none absolute inset-0 bg-black/20" />
          )}
          {/* Sticker badges */}
          <div className="absolute left-4 top-4 flex gap-1.5">
            {WINNING.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-block -rotate-2 rounded-[6px] px-2.5 py-1 text-[9px] font-extrabold tracking-[0.4px] ${tag === 'Bestseller' ? 'bg-accent-yellow text-bg-primary' : 'bg-accent-red text-white'}`}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
          {/* Price badge */}
          <div className="absolute bottom-4 right-4 rounded-xl border border-white/[0.08] bg-black/60 px-4 py-2.5 text-right backdrop-blur-xl">
            <div className="text-[11px] text-text-tertiary line-through">
              {WINNING.oldPrice}
            </div>
            <div className="text-[22px] font-black tracking-tight text-accent-yellow">
              {WINNING.price}
            </div>
          </div>
        </div>

        {/* Info side */}
        <div
          className="flex flex-col justify-center"
          style={{ padding: 'clamp(24px, 3vw, 44px)' }}
        >
          <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-accent-purple">
            {WINNING.genre}
          </div>
          <h3
            className="mb-1.5 font-black leading-[1.1] tracking-[-1.2px] text-text-primary"
            style={{ fontSize: 'clamp(24px, 2.8vw, 36px)' }}
          >
            {WINNING.title}
          </h3>
          <p className="mb-[18px] text-sm font-medium text-text-tertiary">
            {WINNING.sub}
          </p>
          <p className="mb-7 text-[13.5px] leading-[1.7] text-text-dim">
            {WINNING.desc}
          </p>
          <div className="mb-5 flex gap-2">
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-yellow flex flex-1 items-center justify-center gap-2 rounded-[11px] bg-shopee-orange py-[13px] text-sm font-bold text-white no-underline"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Beli di Shopee
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-[46px] items-center justify-center rounded-[11px] bg-accent-green-dark text-white no-underline transition-[filter] hover:brightness-110"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
          <div className="flex gap-3 text-[11px] text-text-faint">
            <span>{WINNING.size}</span>
            <span>&middot;</span>
            <span>Windows 10+</span>
            <span>&middot;</span>
            <span>Instant delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// BENTO FEATURES GRID
// ═══════════════════════════════════════════════════════════════
const BENTO_CELLS = [
  {
    span: 'wide',
    icon: '01',
    title: 'Cari & Temukan Instant',
    body: 'Ketik nama game, langsung ketemu. Search engine kami dirancang untuk hasil cepat tanpa loading lama.',
    accent: '#FFD100',
  },
  {
    span: 'tall',
    icon: '02',
    title: 'Request Tanpa Ribet',
    body: 'Isi form singkat, tanpa login, tanpa registrasi. Game belum ada? Kami carikan.',
    accent: '#8B5CF6',
  },
  {
    span: 'normal',
    icon: '03',
    title: 'Tracking Real-time',
    body: 'Setiap request punya kode unik. Pantau status dari pending sampai ready.',
    accent: '#22D3EE',
  },
  {
    span: 'normal',
    icon: '04',
    title: 'Support via WhatsApp',
    body: 'Butuh bantuan install? Tim kami siap remote install via AnyDesk/TeamViewer.',
    accent: '#22C55E',
  },
];

const BentoFeatures = () => (
  <section className="mx-auto max-w-[1200px] px-6 pb-20">
    <div className="mb-9">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[2.5px] text-accent-purple">
        Kenapa MyGameON?
      </p>
      <h2
        className="font-black leading-[1.08] tracking-[-1.2px] text-text-primary"
        style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
      >
        Dibuat untuk gamer
        <br />
        yang nggak mau ribet.
      </h2>
    </div>
    <div
      className="bento-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'auto auto',
        gap: 10,
      }}
    >
      {BENTO_CELLS.map((c, i) => {
        const gridStyle =
          c.span === 'wide'
            ? { gridColumn: 'span 2' }
            : c.span === 'tall'
              ? { gridRow: 'span 2' }
              : {};
        return (
          <div key={i} style={gridStyle}>
            <div
              className="flex h-full cursor-default flex-col rounded-2xl border border-border-default bg-bg-primary transition-all duration-200"
              style={{ padding: c.span === 'tall' ? '28px 24px' : 24 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent + '40';
                e.currentTarget.style.boxShadow = `0 0 32px ${c.accent}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#151920';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="flex items-center gap-2.5"
                style={{ marginBottom: c.span === 'tall' ? 24 : 16 }}
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-[9px]"
                  style={{
                    background: c.accent + '12',
                    border: `1px solid ${c.accent}25`,
                  }}
                >
                  <span
                    className="text-[11px] font-black"
                    style={{ color: c.accent }}
                  >
                    {c.icon}
                  </span>
                </div>
              </div>
              <h3
                className="mb-2 font-extrabold leading-[1.25] tracking-tight text-text-secondary"
                style={{ fontSize: c.span === 'wide' ? 18 : 15.5 }}
              >
                {c.title}
              </h3>
              <p className="flex-1 text-[13px] leading-[1.65] text-text-dim">
                {c.body}
              </p>
              {c.span === 'tall' && (
                <div className="mt-5 rounded-[10px] border border-border-subtle bg-bg-surface px-4 py-3.5">
                  <div className="mb-1.5 text-[10px] font-semibold tracking-[0.5px] text-text-faint">
                    CONTOH
                  </div>
                  <div className="text-xs leading-[1.5] text-text-tertiary">
                    &quot;Halo, saya mau request{' '}
                    <span className="text-accent-purple-light">Tekken 8</span>{' '}
                    dong.&quot;
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// GAME CATALOG (Firestore + Fuse.js) — preserved logic
// ═══════════════════════════════════════════════════════════════
const FUSE_OPTIONS = {
  keys: ['title', 'tags'],
  threshold: 0.35,
  ignoreLocation: true,
};

const CatalogCard = ({ game }) => {
  const title = game.title || 'Untitled';
  const coverSrc = game.coverImageUrl || null;
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
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="cursor-pointer overflow-hidden rounded-[14px] transition-all duration-200"
      style={{
        background: '#0D0F14',
        border: `1px solid ${hov ? 'rgba(255,209,0,0.25)' : '#151920'}`,
        boxShadow: hov ? '0 12px 36px rgba(0,0,0,0.5)' : 'none',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {coverSrc ? (
          <>
            <LazyLoadImage
              src={coverSrc}
              alt={title}
              effect="blur"
              className="h-full w-full object-cover transition-all duration-300"
              style={{
                opacity: hov ? 1 : 0.8,
                transform: hov ? 'scale(1.05)' : 'scale(1)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#060914] to-[#1e3a5f]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </div>
        )}
        <div className="absolute bottom-2.5 left-3 right-3">
          {genre && (
            <div className="mb-[3px] text-[9px] uppercase tracking-[1.5px] text-white/35">
              {genre}
            </div>
          )}
          <div className="text-[12.5px] font-extrabold leading-[1.2] text-white">
            {title}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="mb-1.5 truncate text-[13px] font-bold text-[#D1D5DB]">
          {title}
        </h4>
        {game.tags && Array.isArray(game.tags) && game.tags.length > 0 && (
          <div className="mb-2 flex gap-1">
            {game.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-[5px] border border-border-subtle bg-bg-surface px-[7px] py-[2px] text-[9.5px] text-text-dim"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {sizeDisplay && (
          <div className="mb-2.5 text-[10.5px] text-text-ghost">
            {sizeDisplay}
          </div>
        )}
        <div className="flex gap-1">
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-shopee-orange py-2 text-center text-[11.5px] font-bold text-white no-underline transition-[filter] hover:brightness-110"
          >
            Shopee
          </a>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="grid w-[34px] place-items-center rounded-lg bg-accent-green-dark text-white no-underline transition-[filter] hover:brightness-110"
          >
            <MessageCircle className="h-3 w-3" />
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
    <section id="catalog" className="mx-auto max-w-[1200px] px-6 pb-20">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[2.5px] text-text-ghost">
            Katalog
          </p>
          <h2
            className="font-black leading-[1.08] tracking-[-1.2px] text-text-primary"
            style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
          >
            Koleksi Game
          </h2>
        </div>
        <span className="text-xs font-semibold text-text-hidden">
          {filtered.length} game
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-[400px]">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
        <input
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Cari game..."
          className="w-full rounded-[11px] border border-border-default bg-bg-secondary py-3 pl-[42px] pr-4 font-sans text-[13.5px] text-text-primary outline-none transition-[border-color] duration-200 placeholder:text-text-faint focus:border-accent-yellow/35"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-[14px] border border-border-default bg-bg-primary"
            >
              <div
                className="bg-border-default"
                style={{ aspectRatio: '4/3' }}
              />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-3/4 rounded bg-border-default" />
                <div className="h-3 w-1/2 rounded bg-border-default" />
              </div>
            </div>
          ))}
        </div>
      ) : paged.length > 0 ? (
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          }}
        >
          {paged.map((game) => (
            <CatalogCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-text-ghost">Tidak ditemukan.</p>
          <Link
            to="/request-game"
            className="btn-yellow inline-block rounded-[10px] bg-accent-yellow px-5 py-2.5 text-[13px] font-bold text-bg-primary no-underline"
          >
            Request Game Ini
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border-default text-text-muted transition-colors hover:bg-bg-surface disabled:pointer-events-none disabled:opacity-30"
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
              if (prev !== -1 && i - prev > 1)
                items.push(
                  <span
                    key={`e${i}`}
                    className="grid h-9 w-9 select-none place-items-center text-xs text-text-tertiary"
                  >
                    &hellip;
                  </span>
                );
              items.push(
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-accent-yellow text-bg-primary' : 'border border-border-default text-text-muted hover:bg-bg-surface'}`}
                >
                  {i + 1}
                </button>
              );
              prev = i;
            }
            return items;
          })()}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border-default text-text-muted transition-colors hover:bg-bg-surface disabled:pointer-events-none disabled:opacity-30"
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
// BLOG & NEWS SECTION
// ═══════════════════════════════════════════════════════════════
const BLOG_POSTS = [
  {
    id: 1,
    tag: 'Update',
    tagColor: '#EF4444',
    title: 'Cyberpunk 2077 Patch 2.2 — Apa yang Baru?',
    excerpt:
      'Update terbesar tahun ini membawa fitur ray-tracing baru, quest tambahan, dan peningkatan performa signifikan.',
    date: '25 Mei 2026',
    readTime: '3 min',
  },
  {
    id: 2,
    tag: 'Tips',
    tagColor: '#8B5CF6',
    title: '5 Game PC Ringan yang Seru untuk Low-Spec',
    excerpt:
      'Spek PC terbatas? Tenang. Ini rekomendasi game seru yang bisa jalan di RAM 4GB dan GPU integrated.',
    date: '22 Mei 2026',
    readTime: '4 min',
  },
  {
    id: 3,
    tag: 'News',
    tagColor: '#F97316',
    title: 'GTA VI — Semua yang Perlu Kamu Tahu',
    excerpt:
      'Rockstar akhirnya rilis trailer kedua. Apa saja yang sudah dikonfirmasi? Kami rangkum semuanya di sini.',
    date: '20 Mei 2026',
    readTime: '5 min',
  },
  {
    id: 4,
    tag: 'Tutorial',
    tagColor: '#22D3EE',
    title: 'Cara Install Game dari Google Drive — Panduan Lengkap',
    excerpt:
      'Step by step download, extract, dan install game yang kamu beli dari MyGameON. Pemula friendly.',
    date: '18 Mei 2026',
    readTime: '6 min',
  },
];

const BlogSection = () => (
  <section className="border-y border-[#111317] bg-bg-secondary">
    <div className="mx-auto max-w-[1200px] px-6 py-[72px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[2.5px] text-accent-orange">
            Blog & Update
          </p>
          <h2
            className="font-black leading-[1.1] tracking-[-1px] text-text-primary"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
          >
            Info Terkini Dunia Game
          </h2>
        </div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-yellow no-underline hover:underline"
        >
          Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
      >
        {BLOG_POSTS.map((post) => (
          <Link
            to="/blog"
            key={post.id}
            className="flex h-full cursor-pointer flex-col rounded-[14px] border border-border-default bg-bg-primary no-underline transition-all duration-200 hover:-translate-y-[3px]"
            style={{ padding: '22px 20px' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = post.tagColor + '40')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = '#151920')
            }
          >
            <div className="mb-3.5 flex items-center gap-2">
              <span
                className="rounded-[5px] px-[9px] py-[3px] text-[10px] font-extrabold tracking-[0.5px]"
                style={{
                  background: post.tagColor + '18',
                  color: post.tagColor,
                }}
              >
                {post.tag.toUpperCase()}
              </span>
              <span className="text-[10.5px] text-text-ghost">{post.date}</span>
            </div>
            <h3 className="mb-2.5 text-[15.5px] font-extrabold leading-[1.35] tracking-tight text-text-secondary">
              {post.title}
            </h3>
            <p className="flex-1 text-[12.5px] leading-[1.65] text-text-dim">
              {post.excerpt}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-border-default pt-3.5">
              <span className="text-[10.5px] font-medium text-text-ghost">
                {post.readTime} baca
              </span>
              <span
                className="flex items-center gap-1 text-[11px] font-bold"
                style={{ color: post.tagColor }}
              >
                Baca <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// CTA BANNER
// ═══════════════════════════════════════════════════════════════
const CTABanner = () => (
  <section className="mx-auto max-w-[1200px] px-6 py-[72px]">
    <div
      className="relative overflow-hidden rounded-[20px] border border-accent-purple/15 bg-gradient-to-br from-bg-primary to-[#110D1E]"
      style={{ padding: 'clamp(32px, 4vw, 56px)' }}
    >
      <div
        className="pointer-events-none absolute -right-[60px] -top-[60px] h-[300px] w-[300px] rounded-full bg-accent-purple/20"
        style={{ filter: 'blur(80px)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-[20%] h-[200px] w-[200px] rounded-full bg-accent-yellow/[0.08]"
        style={{ filter: 'blur(60px)' }}
      />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-7">
        <div className="min-w-0 flex-[1_1_320px]">
          <h2
            className="mb-2.5 font-black leading-[1.15] tracking-[-0.8px] text-text-primary"
            style={{ fontSize: 'clamp(22px, 2.8vw, 34px)' }}
          >
            Game Belum Ada?
            <br />
            <span className="text-accent-yellow">Request Sekarang.</span>
          </h2>
          <p className="max-w-[420px] text-sm leading-[1.65] text-text-dim">
            Kami review setiap request satu per satu. Proses jelas, transparan
            dari awal sampai ready.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/request-game"
            className="btn-yellow inline-flex items-center gap-2 rounded-xl bg-accent-yellow px-6 py-3.5 text-[15px] font-extrabold text-bg-primary no-underline"
          >
            Kirim Request <ArrowRight className="h-[15px] w-[15px]" />
          </Link>
          <Link
            to="/request-status"
            className="inline-flex items-center rounded-xl border border-border-muted px-6 py-3.5 text-[15px] font-semibold text-text-dim no-underline transition-all hover:border-text-ghost hover:text-[#9CA3AF]"
          >
            Cek Status
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// CONTACT SECTION
// ═══════════════════════════════════════════════════════════════
const ContactSection = () => (
  <section className="mx-auto max-w-[1200px] px-6 pb-20">
    <div className="grid gap-3 sm:grid-cols-2">
      {/* WhatsApp */}
      <div className="rounded-2xl border border-border-default bg-bg-primary p-6">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-[10px] border border-accent-green/25 bg-accent-green/10">
          <MessageCircle className="h-5 w-5 text-accent-green" />
        </div>
        <h3 className="mb-1 text-[15px] font-extrabold text-text-secondary">
          Chat WhatsApp
        </h3>
        <p className="mb-5 text-[13px] leading-[1.6] text-text-dim">
          Butuh bantuan install atau tanya soal game? Langsung chat admin.
        </p>
        <a
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent-green-dark px-5 py-2.5 text-[13px] font-bold text-white no-underline transition-[filter] hover:brightness-110"
        >
          Hubungi <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      {/* FAQ */}
      <div className="rounded-2xl border border-border-default bg-bg-primary p-6">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-[10px] border border-accent-yellow/25 bg-accent-yellow/10">
          <HelpCircle className="h-5 w-5 text-accent-yellow" />
        </div>
        <h3 className="mb-1 text-[15px] font-extrabold text-text-secondary">
          FAQ & Tutorial
        </h3>
        <p className="mb-5 text-[13px] leading-[1.6] text-text-dim">
          Cek pertanyaan yang sering ditanyakan atau tonton video panduan.
        </p>
        <Link
          to="/faq"
          className="inline-flex items-center gap-2 rounded-[10px] border border-accent-yellow/25 px-5 py-2.5 text-[13px] font-bold text-accent-yellow no-underline transition-colors hover:bg-accent-yellow/10"
        >
          Lihat FAQ <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════
const LandingFooter = () => (
  <footer className="border-t border-[#0F1115] bg-bg-secondary px-6 py-8">
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-8">
        {/* Brand */}
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MyGameON"
              className="h-[26px] w-[26px] object-contain"
            />
            <span className="text-sm font-extrabold tracking-tight text-text-dim">
              MyGameON
            </span>
          </div>
          <p className="max-w-[260px] text-[11.5px] leading-[1.6] text-text-faint">
            Katalog game PC terlengkap. Cari, beli, dan request game favoritmu
            di satu tempat.
          </p>
        </div>
        {/* Link columns */}
        <div className="flex flex-wrap gap-10">
          <div>
            <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-[1.5px] text-text-dim">
              Navigasi
            </h4>
            {[
              { label: 'Katalog', href: '#catalog' },
              { label: 'Request Game', to: '/request-game' },
              { label: 'Cek Status', to: '/request-status' },
              { label: 'Download', to: '/downloads' },
              { label: 'Blog', to: '/blog' },
            ].map((l) =>
              l.to ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className="mb-2 block text-xs font-medium text-text-faint no-underline transition-colors hover:text-text-muted"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  className="mb-2 block text-xs font-medium text-text-faint no-underline transition-colors hover:text-text-muted"
                >
                  {l.label}
                </a>
              )
            )}
          </div>
          <div>
            <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-[1.5px] text-text-dim">
              Bantuan
            </h4>
            {[
              { label: 'FAQ', to: '/faq' },
              { label: 'Tutorial Video', to: '/videos' },
              { label: 'WhatsApp', href: `https://wa.me/${WA_NUMBER}` },
            ].map((l) =>
              l.to ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className="mb-2 block text-xs font-medium text-text-faint no-underline transition-colors hover:text-text-muted"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 block text-xs font-medium text-text-faint no-underline transition-colors hover:text-text-muted"
                >
                  {l.label}
                </a>
              )
            )}
          </div>
        </div>
      </div>
      {/* Bottom */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#0F1115] pt-5">
        <p className="text-[11px] text-text-faint">
          &copy; {new Date().getFullYear()} MyGameON Hub. All rights reserved.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-[10px] font-semibold text-text-ghost no-underline transition-all hover:border-accent-yellow/30 hover:text-text-dim"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Admin Login
        </Link>
      </div>
    </div>
  </footer>
);

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
      className="fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full bg-accent-yellow text-bg-primary shadow-lg transition-all hover:scale-105 hover:brightness-90"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
      <Seo
        title=""
        description="MyGameON menyediakan ribuan game PC digital lengkap dengan update terbaru. Beli lewat Shopee atau request game favoritmu — proses cepat tanpa ribet."
        path="/"
      />
      <NavBar />
      <Hero />
      <WinningProduct />
      <BentoFeatures />
      <GameCatalogSection />
      <BlogSection />
      <CTABanner />
      <ContactSection />
      <LandingFooter />
      <ScrollToTopButton />
    </div>
  );
};

export default LandingPage;
