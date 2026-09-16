import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Layers, Wrench, Disc, Menu, X, ShieldCheck, Download, Gamepad2, LogIn, HardDrive } from 'lucide-react';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../../config/integrations';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { useAuth } from '../../../contexts/AuthContext';

const LandingNavbar = () => {
  const { currentUser, isAdmin } = useAuth();
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
      {/* Top Trust Announcement Bar */}
      <div className="bg-[#0C0F17] border-b border-white/5 px-4 py-1.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-400" /> Toko Resmi Shopee MyGameON
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="hidden sm:inline text-slate-300">
          Order via WhatsApp untuk Proses Kilat 0 Detik & Bebas Biaya Layanan
        </span>
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
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm group-hover:border-amber-400/60 transition-colors">
              <Gamepad2 size={18} />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
              MyGame<span className="text-amber-400">ON</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            <Link
              to="/katalog"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Katalog Game
            </Link>
            <Link
              to="/library"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <HardDrive size={13} className="text-emerald-400" />
              <span>Game Saya</span>
            </Link>
            <a
              href="#bundling"
              className="font-medium px-3 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors flex items-center gap-1.5"
            >
              <Layers size={13} className="text-amber-400" />
              <span>Paket Bundling</span>
            </a>
            <a
              href="#sims-launcher"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              The Sims 4
            </a>
            <a
              href="#toolkit"
              className="font-medium px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              DirectX & Tools
            </a>
            <Link
              to="/claim"
              className="font-bold px-3 py-1.5 rounded-xl text-orange-400 bg-shopee-orange/10 border border-shopee-orange/30 hover:bg-shopee-orange/20 transition-all ml-1 flex items-center gap-1.5"
            >
              <ShoppingBag size={14} className="text-shopee-orange" />
              <span>Klaim Pesanan Shopee</span>
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
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
          <Link
            to="/katalog"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <Gamepad2 size={16} className="text-amber-400" />
            <span>Katalog Game PC</span>
          </Link>
          <a
            href="#bundling"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-bold text-amber-400 hover:bg-amber-400/10 flex items-center gap-2.5"
          >
            <Layers size={16} className="text-amber-400" />
            <span>Paket Bundling Hemat</span>
          </a>
          <a
            href="#sims-launcher"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <Disc size={16} className="text-emerald-400" />
            <span>The Sims 4 Launcher</span>
          </a>
          <a
            href="#toolkit"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5 flex items-center gap-2.5"
          >
            <Wrench size={16} className="text-cyan-400" />
            <span>DirectX & VC++ Toolkit</span>
          </a>
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
