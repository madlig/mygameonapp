// src/features/landing/utils/coverHelper.js
//
// Standarisasi resolusi cover game 100% dari Steam Official CDN (library_600x900.jpg / header.jpg).
// Menolak cover lama di Firebase Storage yang buram atau bertuliskan promosi kustom.

export const DEFAULT_STEAM_COVER = '/defaultcoverthumb.webp';

// Peta Steam AppID presisi untuk judul-judul game berseri agar tidak saling menimpa
const POPULAR_STEAM_APP_MAP = {
  // Naruto franchise (wajib spesifik per seri)
  'naruto x boruto ultimate ninja storm connections': '1020790',
  'naruto x boruto': '1020790',
  'naruto shippuden ultimate ninja storm 3 full burst': '234670',
  'naruto shippuden ultimate ninja storm 3': '234670',
  'naruto shippuden ultimate ninja storm 2': '543870',
  'naruto ultimate ninja storm 4': '349040',
  'naruto ultimate ninja storm 1': '495140',
  'naruto ultimate ninja storm': '495140',

  // Grand Theft Auto franchise
  'grand theft auto the trilogy': '1546970',
  'grand theft auto san andreas definitive edition': '1547000',
  'grand theft auto san andreas': '1547000',
  'grand theft auto iv complete edition': '12210',
  'grand theft auto iv': '12210',
  'grand theft auto iii': '1546970',
  'grand theft auto v': '271590',
  'gta v': '271590',

  // Subnautica franchise
  'subnautica below zero': '848450',
  'subnautica': '264710',

  // God of War
  'god of war ragnarok': '2322010',
  'god of war': '1593500',

  // Passpartout
  'passpartout 2 the lost artist': '1571100',
  'passpartout 2': '1571100',
  'passpartout': '582550',

  // Simulator & Lainnya
  'autobahn police simulator 3': '1065520',
  'farming simulator 25': '2300320',
  'contraband police': '756800',
  'car dealer simulator': '2404880',
  'brothers a tale of two sons': '225080',
  'age of empire 3': '933110',
  'resident evil 4 remake': '2050650',
  'resident evil 4': '2050650',
  'chef rpg': '1796790',
  'snow runner': '1465360',
  'stardew valley': '413150',
  'a space for the unbound': '1201270',
  'internet cafe and supermarket simulator 2024': '2563770',
  'settlement survival': '1509510',
  'under the waves': '1975440',
  'youtubers life 2': '1493760',
  'little nightmare 2': '860510',
  'bravely default ii': '1446650',
  'stranded deep': '313120',
  'dragons dogma dark arisen': '367500',
  'need for speed most wanted': '1262560',
  'the sims 4': '1222670',
  'the sims 3': '47890',
  'remnant 2': '1282100',
  'hades': '1145360',
  'final fantasy xiii-2': '292140',
  'motogp 23': '2101300',
  'tekken 8': '1778820',
  'cyberpunk 2077': '1091500',
  'elden ring': '1245620',
  'red dead redemption 2': '1174180',
};

const SORTED_APP_ENTRIES = Object.entries(POPULAR_STEAM_APP_MAP).sort((a, b) => b[0].length - a[0].length);

/**
 * Mengembalikan URL poster vertikal resmi Steam (600x900 3:4 / header.jpg).
 * @param {object} game
 * @returns {string} URL Steam CDN
 */
export function getSteamCoverUrl(game) {
  if (!game) return DEFAULT_STEAM_COVER;

  // 1. Prioritaskan URL Steam yang sudah terverifikasi di Firestore
  if (
    typeof game.coverImageUrl === 'string' &&
    (game.coverImageUrl.includes('steamstatic.com') || game.coverImageUrl.includes('steampowered.com'))
  ) {
    return game.coverImageUrl;
  }

  // 2. Jika ada steamAppId resmi di Firestore
  const appId = game.steamAppId || game.steam_appid || game.steamId;
  if (appId) {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;
  }

  // 3. Resolusi cerdas via pemetaan nama game ke Steam AppID (urutan panjang ke pendek)
  const title = (game.title || game.name || '').toLowerCase().trim();
  for (const [key, mappedAppId] of SORTED_APP_ENTRIES) {
    if (title.includes(key)) {
      return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${mappedAppId}/library_600x900.jpg`;
    }
  }

  // 4. Default Fallback
  return DEFAULT_STEAM_COVER;
}
