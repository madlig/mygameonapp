// src/features/landing/components/GameCardV2.jsx
import React, { useState } from 'react';
import { HardDrive, Eye, ShoppingBag, Check } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { formatFileSize } from '../../games/utils/formatters';
import { getSteamCoverUrl, DEFAULT_STEAM_COVER } from '../utils/coverHelper';
import { evaluateGameCompatibility } from '../hooks/useDeviceSpec';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import { useCart } from '../../../contexts/CartContext';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../../config/integrations';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { trackClickShopee, trackClickWhatsApp } from '../../../utils/metaPixel';
import { getGamePriceFormatted } from '../../../utils/pricing';

// Package type display config
const PACKAGE_BADGE = {
  'PRE-INSTALLED': { label: 'Siap Main', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15' },
  'INSTALLER-GOG': { label: 'GOG Installer', color: 'text-violet-400 border-violet-500/40 bg-violet-500/15' },
  'INSTALLER-ELAMIGOS': { label: 'Installer', color: 'text-sky-400 border-sky-500/40 bg-sky-500/15' },
  'INSTALLER': { label: 'Installer', color: 'text-sky-400 border-sky-500/40 bg-sky-500/15' },
};

const GameCardV2 = ({ game, onSelectGame, userSpec = 'all', compatibility = null }) => {
  if (!game) return null;

  const { isConfigured, checkGame } = useDeviceProfile();

  // Evaluasi kompatibilitas cerdas jika profil pengguna aktif
  let cardCompat = compatibility;
  if (!cardCompat && isConfigured) {
    const diagResult = checkGame(game);
    if (diagResult) {
      if (diagResult.verdict === 'optimal') {
        cardCompat = { badge: 'Lancar di Laptop Kamu', color: 'emerald' };
      } else if (diagResult.verdict === 'playable') {
        cardCompat = {
          badge: diagResult.fps720p?.color === 'emerald' ? 'Lancar (720p)' : 'Bisa Dimainkan',
          color: 'emerald',
        };
      } else {
        cardCompat = { badge: 'Laptop Belum Kuat', color: 'rose' };
      }
    }
  } else if (!cardCompat && userSpec) {
    cardCompat = evaluateGameCompatibility(game, userSpec);
  }

  const title = game.title || game.name || 'Game PC';
  const coverUrl = getSteamCoverUrl(game);
  const rawSize = game.fileSizeBytes || game.size || 0;
  const formattedSize =
    typeof rawSize === 'number' && rawSize > 0
      ? formatFileSize(rawSize)
      : typeof rawSize === 'string' && rawSize
      ? rawSize
      : 'Cloud';

  const priceFormatted = getGamePriceFormatted(game);

  // Genres — show first two joined with ·
  const genreList =
    Array.isArray(game.genres) && game.genres.length > 0
      ? game.genres
      : Array.isArray(game.genre) && game.genre.length > 0
      ? game.genre
      : ['PC Game'];
  const primaryGenre = genreList[0];
  const secondaryGenre = genreList[1] || null;
  const genreDisplay = secondaryGenre ? `${primaryGenre} · ${secondaryGenre}` : primaryGenre;

  // Package type badge config
  const pkgType = game.packageType || null;
  const pkgBadge = pkgType ? PACKAGE_BADGE[pkgType] || null : null;

  // File version label
  const fileVersion = game.fileVersion || null;

  const { addToCart, isInCart } = useCart();
  const [addedTemp, setAddedTemp] = useState(false);

  const handleAddCart = (e) => {
    e.stopPropagation();
    addToCart(game, {}, false);
    setAddedTemp(true);
    setTimeout(() => setAddedTemp(false), 1500);
  };

  const waUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau order game PC:\n- Judul: ${title}\n- Ukuran: ${formattedSize}\n- Harga: ${priceFormatted}\nMohon info nomor rekening / QRIS dan link download Google Drive-nya ya min.`,
  });

  const handleWaClick = (e) => {
    e.stopPropagation();
    trackClickWhatsApp(title);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const shopeeUrl = game.shopee?.url || game.shopeeLink || INTEGRATIONS.shopeeStoreUrl;

  const handleShopeeClick = (e) => {
    e.stopPropagation();
    trackClickShopee(title);
    window.open(shopeeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    if (onSelectGame) onSelectGame(game);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#090C12] border border-white/10 hover:border-amber-400/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer hover:-translate-y-1.5"
    >
      {/* ── Cover Image Area ── */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0F131D]">
        <LazyLoadImage
          src={coverUrl}
          alt={title}
          effect="blur"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          placeholderSrc={DEFAULT_STEAM_COVER}
        />

        {/* Gradient: top fade for badge legibility + bottom fade for card blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-transparent to-black/55 pointer-events-none" />

        {/* ── Top Row: Primary Genre · Storage Size ── */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-amber-400 border border-amber-500/20 leading-tight">
            {primaryGenre}
          </span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1 font-mono tracking-tight group-hover:border-amber-400/40 transition-colors">
            <HardDrive size={11} className="text-amber-400 stroke-[2.5] shrink-0" />
            <span>{formattedSize}</span>
          </span>
        </div>

        {/* ── Bottom Row on Cover: Package Badge · Version ── */}
        {(pkgBadge || fileVersion) && (
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between gap-1.5 pointer-events-none">
            {pkgBadge ? (
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-md border leading-tight ${pkgBadge.color}`}>
                {pkgBadge.label}
              </span>
            ) : <span />}
            {fileVersion && (
              <span className="text-[9px] font-mono text-slate-400 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 tracking-tight">
                {fileVersion}
              </span>
            )}
          </div>
        )}

        {/* ── Hover Overlay CTA (cover area only) ── */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/40">
              <Eye size={19} className="text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-white bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              Lihat Detail
            </span>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
        <div className="space-y-1.5">
          {/* Title */}
          <h3 className="font-bold text-sm sm:text-[15px] text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
            {title}
          </h3>

          {/* Genre display + compat badge row */}
          <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
            <span className="text-[10px] text-slate-500 font-medium leading-tight truncate">
              {genreDisplay}
            </span>
            {cardCompat && cardCompat.badge && (
              <div className="flex items-center gap-1 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  cardCompat.color === 'emerald' ? 'bg-emerald-400 animate-pulse'
                  : cardCompat.color === 'rose' ? 'bg-rose-400'
                  : cardCompat.color === 'amber' ? 'bg-amber-400'
                  : 'bg-slate-400'
                }`} />
                <span className={`text-[10px] font-semibold ${
                  cardCompat.color === 'emerald' ? 'text-emerald-400'
                  : cardCompat.color === 'rose' ? 'text-rose-400'
                  : cardCompat.color === 'amber' ? 'text-amber-400'
                  : 'text-slate-400'
                }`}>
                  {cardCompat.badge}
                </span>
              </div>
            )}
          </div>

          {/* Price Tag Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
            <span className="text-[11px] font-medium text-slate-400">Harga:</span>
            <span className="text-sm font-black text-amber-400 font-mono tracking-tight">
              {priceFormatted}
            </span>
          </div>
        </div>

        {/* Footer: 3 Instant Action Buttons */}
        <div 
          className="pt-2.5 border-t border-white/[0.08] mt-auto flex flex-col gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Button 1: Tambah Keranjang */}
          <button
            type="button"
            onClick={handleAddCart}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm ${
              addedTemp || isInCart(game?.id)
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                : 'bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-400 hover:text-amber-300'
            }`}
            title={isInCart(game?.id) ? 'Sudah ada di keranjang' : 'Tambah ke Keranjang'}
          >
            {addedTemp ? (
              <>
                <Check size={13} className="shrink-0 stroke-[2.5]" />
                <span>Masuk Keranjang</span>
              </>
            ) : isInCart(game?.id) ? (
              <>
                <Check size={13} className="shrink-0 text-emerald-400" />
                <span>Di Keranjang</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} className="shrink-0" />
                <span>+ Keranjang</span>
              </>
            )}
          </button>

          {/* Row 2: Beli di WA & Beli di Shopee */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleWaClick}
              className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Beli Langsung via WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-400 shrink-0" />
              <span className="truncate">Beli di WA</span>
            </button>

            <button
              type="button"
              onClick={handleShopeeClick}
              className="py-1.5 px-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 text-orange-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Beli via Toko Resmi Shopee"
            >
              <ShoppingBag size={12} className="shrink-0 text-orange-400" />
              <span className="truncate">Shopee</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameCardV2;

