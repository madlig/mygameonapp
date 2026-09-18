import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Layers, Disc, Menu, X, ShieldCheck, Download, Gamepad2, LogIn, HardDrive, PlusCircle, Search, Gauge, HelpCircle } from 'lucide-react';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../../config/integrations';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';

const LandingNavbar = () => {
  const { currentUser, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const waChatUrl = buildWhatsAppUrl({
    text: 'Halo Admin MyGameON, saya mau tanya katalog game PC & promo bundling.',
  });

  return (
    <header className="sticky top-0 z-50 transition-all duration-200">
      {/* Top Trust Announcement Bar with Shopee Claim Fast-Lane */}
      <div className="bg-[#0C0F17] border-b border-white/5 px-4 py-1.5 text-[11px] text-slate-300 flex items-center justify-between sm:justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" /> Toko Resmi Shopee MyGameON
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-400">
            Order via WhatsApp untuk Proses Kilat 0 Detik
          </span>
        </div>

        <Link
          to="/claim"
          className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30 transition-all text-[10px] sm:text-[11px] shadow-sm shrink-0"
        >
          <ShoppingBag size={11} className="text-orange-400" />
          <span>Klaim Pesanan Shopee →</span>
        </Link>
      </div>

      {/* Main Navbar */}
      <nav
        className={`px-4 sm:px-8 py-3 flex items-center justify-between transition-colors ${
          scrolled ? 'bg-[#07090E]/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-[#07090E]/80 backdrop-blur-sm border-b border-white/5'
        }`}
      >
        {/* Logo & Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200">
              <svg viewBox="0 0 120 120" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Badge */}
                <circle cx="60" cy="60" r="56" fill="#221E36" stroke="#FFC800" strokeWidth="5" />
                {/* Controller M Body */}
                <path 
                  d="M36 34 C26 34 20 44 20 56 C20 72 26 88 35 90 C43 92 49 82 53 70 C57 72 63 72 67 70 C71 82 77 92 85 90 C94 88 100 72 100 56 C100 44 94 34 84 34 C74 34 67 41 60 45 C53 41 46 34 36 34 Z" 
                  fill="#FFC800"
                />
                {/* Left Eye (Tetap Terbuka Ramah) */}
                <rect 
                  x="40" 
                  y="44" 
                  width="7.5" 
                  height="16" 
                  rx="3.75" 
                  fill="#221E36" 
                  transform="rotate(8 43.75 52)" 
                />
                {/* Right Eye (Mengedip Nakal/Playful Wink saat di-hover) */}
                <g 
                  className="transition-transform duration-150 ease-in-out group-hover:scale-y-[0.15]"
                  style={{ transformOrigin: '76.25px 52px' }}
                >
                  <rect 
                    x="72.5" 
                    y="44" 
                    width="7.5" 
                    height="16" 
                    rx="3.75" 
                    fill="#221E36" 
                    transform="rotate(-8 76.25 52)" 
                  />
                </g>
              </svg>
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-400/95 transition-colors">
              MyGame<span className="text-amber-400">ON</span>
            </span>
          </Link>




          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            <Link
              to="/katalog"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Katalog
            </Link>
            <a
              href="#cek-spek"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Gauge size={13} className="text-amber-400" />
              <span>Cek Spek</span>
            </a>
            <a
              href="#tentang"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Kenapa Kami</span>
            </a>
            <a
              href="#bundling"
              className="font-medium px-3 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors flex items-center gap-1.5"
            >
              <Layers size={13} className="text-amber-400" />
              <span>Bundling</span>
            </a>
            <a
              href="#faq"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              FAQ
            </a>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Keranjang Belanja Trigger */}
          <button
            type="button"
            onClick={openCart}
            className="relative px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2 transition-all active:scale-95 group"
            title="Buka Keranjang Pesanan"
          >
            <div className="relative">
              <ShoppingBag size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center px-1 shadow-md">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">
              Keranjang
            </span>
          </button>

          <a
            href={waChatUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl hover:bg-emerald-500/20 transition-all"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            <span>Chat WA Admin</span>
          </a>

          <Link
            to="/downloads"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all"
          >
            <Download size={14} />
            <span>Downloads</span>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/library"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-2 shadow-sm"
                title="Koleksi Game Saya"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400/40"
                  />
                ) : (
                  <HardDrive size={13} />
                )}
                <span className="truncate max-w-[90px]">
                  {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Game Saya'}
                </span>
              </Link>
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/30 transition-all"
                  title="Admin Dashboard"
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <Link
              to="/library"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn size={14} className="text-amber-400" />
              <span>Game Saya</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07090E] border-b border-white/10 px-4 py-4 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {/* Mobile Cart Option */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openCart();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-sm font-bold text-amber-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={16} className="text-amber-400" />
              <span>Keranjang Pesanan</span>
            </div>
            {itemCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">
                {itemCount} Game
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Kosong</span>
            )}
          </button>

          <Link
            to="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <Gamepad2 size={16} className="text-amber-400" />
            <span>Katalog Game Lengkap</span>
          </Link>
          <a
            href="#cek-spek"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <Gauge size={16} className="text-amber-400" />
            <span>Cek Spek Laptop</span>
          </a>
          <a
            href="#tentang"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Kenapa Pilih Kami</span>
          </a>
          <a
            href="#bundling"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-bold text-amber-400 hover:bg-amber-400/10 flex items-center gap-2.5"
          >
            <Layers size={16} className="text-amber-400" />
            <span>Paket Bundling Hemat</span>
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <HelpCircle size={16} className="text-slate-400" />
            <span>FAQ & Bantuan</span>
          </a>
          <Link
            to="/request-game"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <PlusCircle size={16} className="text-amber-400" />
            <span>Request Game</span>
          </Link>
          <Link
            to="/library"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5"
          >
            <HardDrive size={16} className="text-emerald-400" />
            <span>Koleksi Game Saya {currentUser ? `(${currentUser.displayName?.split(' ')[0]})` : ''}</span>
          </Link>
          <Link
            to="/claim"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2.5 rounded-xl text-sm font-bold text-orange-400 bg-shopee-orange/10 border border-shopee-orange/25 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} className="text-shopee-orange" />
            <span>Klaim Pesanan Shopee</span>
          </Link>
          {currentUser && isAdmin && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-amber-400 hover:bg-amber-400/10 flex items-center justify-center gap-2 border border-amber-400/20"
            >
              <span>Dashboard Admin</span>
            </Link>
          )}
          <div className="pt-2 flex gap-2">
            <a
              href={waChatUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 bg-emerald-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              <span>Chat WhatsApp</span>
            </a>
            <Link
              to="/downloads"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 bg-white/10 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>Downloads</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
