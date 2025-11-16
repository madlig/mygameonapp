// src/components/GameCard.jsx
import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const GenreIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h2zM7 13h.01M7 17h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h2z"></path>
  </svg>
);
const SizeIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
  </svg>
);
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.428-9.888 9.891 0 2.098.61 4.13 1.737 5.932l-.985 3.628 3.743-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.273-.099-.471-.148-.67.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.523.074-.797.347-.273.273-1.056 1.024-1.056 2.495 0 1.472 1.08 2.893 1.23 3.091.149.198 2.113 3.235 5.116 4.492.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

// 7 hari dianggap "Update"
function isUpdated(updatedAt) {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) / (1000 * 60 * 60 * 24) <= 7;
}

const canonicalMap = [
  { test: (k) => k.includes('co-op') || k.includes('coop'), label: 'Co‑op' },
  { test: (k) => k.includes('low') && k.includes('spec'), label: 'Low Spec' },
  { test: (k) => k.includes('open') && k.includes('world'), label: 'Open World' },
  { test: (k) => k.includes('story'), label: 'Story Rich' },
  { test: (k) => k.includes('pixel'), label: 'Pixel Art' },
  { test: (k) => k === 'aaa' || k.includes('aaa'), label: 'AAA' },
  { test: (k) => k.includes('keyboard'), label: 'Keyboard Only' },
  { test: (k) => k.includes('gamepad') || k.includes('controller'), label: 'Gamepad Support' },
];
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t).trim())
    .map((t) => {
      const k = t.toLowerCase();
      const hit = canonicalMap.find((c) => c.test(k));
      return hit ? hit.label : t;
    });
}

const GameCard = ({ game }) => {
  const defaultCoverArtUrl = 'https://via.placeholder.com/600x450/CCCCCC/FFFFFF?text=No+Image';

  const storeUrl = import.meta.env.VITE_SHOPEE_STORE_URL || 'https://shopee.co.id/mygameon';
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

  const whatsappMessage = encodeURIComponent(
    `Halo, saya tertarik dengan game "${game?.name}". Apakah masih tersedia?`
  );
  const whatsappLink = `https://wa.me/${waNumber}?text=${whatsappMessage}`;
  const shopeeLink = game?.shopeeLink || storeUrl;

  const genreOne =
    Array.isArray(game?.genre) && game.genre.length > 0 ? game.genre[0] : null;
  const sizeWithUnit =
    game?.size && game?.unit ? `${game.size} ${game.unit}` : game?.size || null;

  const version = typeof game?.version === 'string' && game.version.trim() ? game.version.trim() : null;
  const showUpdate = isUpdated(game?.updatedAt);
  const showPopular =
    !showUpdate &&
    (Boolean(game?.isPopular) ||
      (typeof game?.popularityScore === 'number' && game.popularityScore >= 20));

  const allTags = normalizeTags(game?.tags);
  const displayTags = allTags.slice(0, 2);
  const extraTagCount = allTags.length > 2 ? allTags.length - 2 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
      {/* Media */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        <LazyLoadImage
          src={game?.coverArtUrl || defaultCoverArtUrl}
          alt={game?.name || 'Game'}
          effect="blur"
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="w-full h-full object-cover"
        />
        {(showUpdate || showPopular) && (
          <span
            className={`absolute left-2 top-2 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold text-white shadow-sm ${
              showUpdate ? 'bg-rose-600' : 'bg-amber-500'
            }`}
            title={showUpdate ? 'Konten diperbarui baru-baru ini' : 'Banyak diminati minggu ini'}
          >
            {showUpdate ? (version ? `Update ${version}` : 'Update') : 'Populer'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-col gap-2 flex-grow">
          {/* Title 2 baris konsisten */}
          <h4
            className="text-sm sm:text-[15px] font-bold text-gray-800 leading-snug truncate"
            style={{ minHeight: '2.5rem' }}
            title={game?.name}
          >
            {game?.name || 'Untitled'}
          </h4>

          {/* Tags: reservasi tinggi */}
          {displayTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 h-5">
              {displayTags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] sm:text-[11px] rounded-md">
                  {t}
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] sm:text-[11px] rounded-md">
                  +{extraTagCount}
                </span>
              )}
            </div>
          ) : (
            <div className="h-5" aria-hidden="true"></div>
          )}

          {/* Metadata: selalu dua baris */}
          <div className="flex flex-col">
            <div className="h-5 flex items-center text-[11px] sm:text-xs text-gray-600">
              {genreOne ? (
                <span className="inline-flex items-center">
                  <GenreIcon />
                  {genreOne}
                </span>
              ) : (
                <span className="opacity-0 select-none">-</span>
              )}
            </div>
            <div className="h-5 flex items-center text-[11px] sm:text-xs text-gray-600">
              {sizeWithUnit ? (
                <span className="inline-flex items-center">
                  <SizeIcon />
                  {sizeWithUnit}
                </span>
              ) : (
                <span className="opacity-0 select-none">-</span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex w-full overflow-hidden rounded-md">
            <a
              href={shopeeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center flex-grow bg-orange-500 text-white text-sm sm:text-[15px] font-semibold hover:bg-orange-600 transition-colors min-h-[44px] py-2.5"
              aria-label={`Beli "${game?.name}" di Shopee`}
            >
              Shopee
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 bg-green-500 text-white hover:bg-green-600 transition-colors min-h-[44px]"
              aria-label="Chat di WhatsApp"
              title="Chat di WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;