import React from 'react';
import { ShoppingBag, HardDrive, CheckCircle2 } from 'lucide-react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../../config/integrations';
import { formatFileSize } from '../../games/utils/formatters';
import { getSteamCoverUrl, DEFAULT_STEAM_COVER } from '../utils/coverHelper';
import { trackClickShopee, trackClickWhatsApp } from '../../../utils/metaPixel';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { evaluateGameCompatibility } from '../hooks/useDeviceSpec';

const GameCardV2 = ({ game, onSelectGame, userSpec = 'all', compatibility = null }) => {
  if (!game) return null;

  const compat = compatibility || (userSpec ? evaluateGameCompatibility(game, userSpec) : null);

  const title = game.title || game.name || 'Game PC';
  const coverUrl = getSteamCoverUrl(game);
  const rawSize = game.fileSizeBytes || game.size || 0;
  const formattedSize = typeof rawSize === 'number' && rawSize > 0 ? formatFileSize(rawSize) : (typeof rawSize === 'string' && rawSize ? rawSize : 'Direct Cloud');
  const price = game.priceFormatted || (game.price ? `Rp ${Number(game.price).toLocaleString('id-ID')}` : 'Rp 15.000');

  // Determine genre or spec label
  const firstGenre = Array.isArray(game.genres) && game.genres.length > 0 
    ? game.genres[0] 
    : (Array.isArray(game.genre) && game.genre.length > 0 ? game.genre[0] : 'PC Game');

  const shopeeUrl = game.shopee?.url || game.shopeeLink || INTEGRATIONS.shopeeStoreUrl;

  const waOrderUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau order game PC:\n- Judul: ${title}\n- Ukuran: ${formattedSize}\nMohon info nomor rekening dan totalnya ya min.`,
  });

  const handleCardClick = () => {
    if (onSelectGame) {
      onSelectGame(game);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-[#090C12] border border-white/10 hover:border-amber-400/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer"
    >
      
      {/* 3:4 Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0F131D]">
        <LazyLoadImage
          src={coverUrl}
          alt={title}
          effect="blur"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          placeholderSrc={DEFAULT_STEAM_COVER}
        />

        {/* Gradient Overlay for Top Badges & Bottom Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-transparent to-black/60 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-amber-400 border border-white/10">
            {firstGenre}
          </span>
          <span className="text-xs sm:text-[13px] font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-black flex items-center gap-1.5 shadow-md font-mono tracking-tight">
            <HardDrive size={13} className="stroke-[2.5]" />
            <span>{formattedSize}</span>
          </span>
        </div>

        {/* Google Drive Verified Ribbon */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>Full Speed GDrive</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
            {title}
          </h3>

          {/* Device Compatibility Pill */}
          {compat && compat.badge && (
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border ${
              compat.color === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : compat.color === 'amber'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : compat.color === 'rose'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : compat.color === 'purple'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-white/5 border-white/10 text-slate-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                compat.color === 'emerald' ? 'bg-emerald-400' : compat.color === 'amber' ? 'bg-amber-400' : compat.color === 'rose' ? 'bg-rose-400' : compat.color === 'purple' ? 'bg-purple-400' : 'bg-slate-400'
              }`} />
              <span className="truncate">{compat.badge}</span>
            </div>
          )}
        </div>

        {/* Dual High-Conversion Actions */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10 mt-auto">
          {/* Primary CTA: WhatsApp Direct Fast-Lane */}
          <a
            href={waOrderUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackClickWhatsApp(title);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current flex-shrink-0" />
            <span>Beli via WhatsApp</span>
          </a>

          {/* Secondary CTA: Official Shopee Marketplace */}
          <a
            href={shopeeUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackClickShopee(title);
            }}
            title={`Beli ${title} di Toko Shopee MyGameON`}
            className="w-full bg-shopee-orange/10 hover:bg-shopee-orange/20 active:scale-[0.98] border border-shopee-orange/35 hover:border-shopee-orange/60 text-orange-400 hover:text-orange-300 font-extrabold text-[11px] sm:text-xs py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <ShoppingBag size={14} className="stroke-[2.2] text-shopee-orange flex-shrink-0" />
            <span>Beli di Toko Shopee</span>
          </a>
        </div>
      </div>

    </div>
  );
};

export default GameCardV2;
