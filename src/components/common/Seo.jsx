// src/components/common/Seo.jsx
//
// Komponen SEO reusable berbasis react-helmet-async.
// Pasang di tiap halaman publik untuk title, meta description,
// canonical, dan Open Graph / Twitter yang unik per-route.
//
// Contoh:
//   <Seo
//     title="Request Game"
//     description="Game belum ada? Request di sini."
//     path="/request-game"
//   />

import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://mygameon.store';
const SITE_NAME = 'MyGameON';
const DEFAULT_TITLE = 'MyGameON — Toko Game PC Digital & Request Game';
const DEFAULT_DESC =
  'MyGameON menyediakan ribuan game PC digital lengkap dengan update terbaru. Beli lewat Shopee atau request game favoritmu — proses cepat tanpa ribet.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = '',
  image = DEFAULT_IMAGE,
  noindex = false,
}) {
  // Title penuh: "Halaman | MyGameON" — atau default kalau title kosong.
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
