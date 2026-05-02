// src/features/landing/components/GameList.jsx
//
// Komponen card game untuk Algolia InstantSearch (hit component).
// Refactored Apr 2026 untuk schema baru.
//
// Field mapping (lama → baru):
//   game.genre[]     → game.genres[]
//   game.size+unit   → game.fileSizeBytes  (diformat via formatFileSize)
//   game.version     → game.fileVersion
//   game.shopeeLink  → game.shopee?.url
//   game.coverArtUrl → game.coverImageUrl

import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { formatFileSize, resolveTimestamp } from '../../games/utils/formatters';

// ============================================================
// HELPERS
// ============================================================

const defaultCover =
  'https://via.placeholder.com/600x450/1a1f27/FFD100?text=MyGameON';

const STORE_URL =
  import.meta.env.VITE_SHOPEE_STORE_URL || 'https://shopee.co.id/mygameon';
const WA_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

/**
 * Apakah game ini baru di-update dalam 7 hari terakhir?
 */
function isRecentlyUpdated(updatedAt) {
  if (!updatedAt) return false;
  const date = resolveTimestamp(updatedAt);
  if (!date) return false;
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/**
 * Ambil genre pertama untuk display (dari array genres baru).
 * Capitalize first letter untuk display.
 */
function getFirstGenre(genres) {
  if (!Array.isArray(genres) || genres.length === 0) return null;
  const g = genres[0];
  if (!g) return null;
  return g.charAt(0).toUpperCase() + g.slice(1);
}

// ============================================================
// ICON COMPONENTS
// ============================================================

const WhatsAppIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const GenreIcon = () => (
  <svg
    className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
    />
  </svg>
);

const SizeIcon = () => (
  <svg
    className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
    />
  </svg>
);

// ============================================================
// MAIN COMPONENT (Algolia hit component)
// ============================================================

const GameList = ({ hit }) => {
  const game = hit;

  const gameTitle = game.title || 'Untitled';

  // Shopee URL (schema baru: shopee.url)
  const shopeeUrl = game.shopee?.url || STORE_URL;

  // Cover image (schema baru: coverImageUrl)
  const coverSrc = game.coverImageUrl || defaultCover;

  // Genre (schema baru: genres[])
  const genreDisplay = getFirstGenre(game.genres);

  // Size (schema baru: fileSizeBytes)
  const sizeDisplay = game.fileSizeBytes
    ? formatFileSize(game.fileSizeBytes)
    : null;

  // Version badge (schema baru: fileVersion)
  const fileVersion =
    typeof game.fileVersion === 'string' && game.fileVersion.trim()
      ? game.fileVersion.trim()
      : null;

  // Update/popular badge
  const showUpdate = isRecentlyUpdated(game.updatedAt);
  const showPopular =
    !showUpdate &&
    (Boolean(game.isPopular) ||
      (typeof game.popularityScore === 'number' && game.popularityScore >= 20));

  // Tags (tetap pakai game.tags[], tidak berubah)
  const tags = Array.isArray(game.tags) ? game.tags.slice(0, 2) : [];
  const extraTagCount =
    Array.isArray(game.tags) && game.tags.length > 2
      ? game.tags.length - 2
      : 0;

  // WhatsApp
  const waMessage = encodeURIComponent(
    `Halo, saya tertarik dengan game "${gameTitle}". Apakah masih tersedia?`
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  return (
    <div className="flex flex-col h-full border-0 shadow-none rounded-none sm:border sm:border-gray-200 sm:shadow-sm sm:hover:shadow-md sm:rounded-xl sm:bg-white sm:overflow-hidden bg-white">
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 sm:rounded-t-xl overflow-hidden">
        <LazyLoadImage
          src={coverSrc}
          alt={gameTitle}
          effect="blur"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 33vw, 25vw"
          className="w-full h-full object-cover"
        />

        {/* Update / Popular badge */}
        {(showUpdate || showPopular) && (
          <span
            className={`absolute left-3 top-3 px-3 py-1 rounded-md text-[11px] font-semibold tracking-wide text-white shadow-sm ${
              showUpdate ? 'bg-rose-600' : 'bg-amber-500'
            }`}
          >
            {showUpdate
              ? fileVersion
                ? `Update ${fileVersion}`
                : 'Update'
              : 'Populer'}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-grow px-4 py-4">
        {/* Title */}
        <h4
          className="text-base font-bold text-gray-800 leading-snug truncate"
          style={{ minHeight: '2.5rem' }}
          title={gameTitle}
        >
          {gameTitle}
        </h4>

        {/* Tags */}
        <div className="mt-2 min-h-[20px]">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] rounded-md"
                >
                  {t}
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md">
                  +{extraTagCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Genre & Size */}
        <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-600">
          <div className="h-5 flex items-center">
            {genreDisplay ? (
              <span className="inline-flex items-center">
                <GenreIcon />
                {genreDisplay}
              </span>
            ) : (
              <span className="opacity-0 select-none">-</span>
            )}
          </div>
          <div className="h-5 flex items-center">
            {sizeDisplay ? (
              <span className="inline-flex items-center">
                <SizeIcon />
                {sizeDisplay}
              </span>
            ) : (
              <span className="opacity-0 select-none">-</span>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-auto pt-5">
          <div className="flex w-full overflow-hidden rounded-md sm:rounded-lg">
            <a
              href={shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center flex-grow bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors min-h-[46px]"
              aria-label={`Beli "${gameTitle}" di Shopee`}
            >
              Shopee
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 bg-green-500 text-white hover:bg-green-600 transition-colors min-h-[46px]"
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

export default GameList;
