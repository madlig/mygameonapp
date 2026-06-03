// src/utils/metaPixel.js
//
// Meta Pixel (Facebook Pixel) utility.
//
// Menyediakan inisialisasi pixel + wrapper aman untuk `fbq`, serta helper
// bertema domain (lihat game, klik Shopee/WhatsApp, request game, search)
// yang memetakan ke standard Meta Pixel events:
//
//   trackViewGame      → ViewContent
//   trackClickShopee   → AddToCart
//   trackClickWhatsApp → Contact
//   trackGameRequest   → Lead
//   trackSearch        → Search
//
// Semua fungsi no-op secara aman bila `fbq` belum siap (mis. saat SSR,
// ad-blocker, atau sebelum initMetaPixel() dipanggil).

const PIXEL_ID = '1027159286656110';

let initialized = false;

// ============================================================
// CORE
// ============================================================

// Inject base code Meta Pixel (idempotent) lalu init + PageView pertama.
export function initMetaPixel() {
  if (typeof window === 'undefined' || initialized) return;

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  initialized = true;
}

// PageView untuk navigasi SPA berikutnya.
export function trackPageView() {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', 'PageView');
}

// Track standard Meta Pixel event (ViewContent, AddToCart, Contact, dll.).
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.fbq || !eventName) return;
  window.fbq('track', eventName, params);
}

// Track custom (non-standard) event.
export function trackCustomEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.fbq || !eventName) return;
  window.fbq('trackCustom', eventName, params);
}

// ============================================================
// DOMAIN HELPERS
// ============================================================

// User melihat detail game → ViewContent.
export function trackViewGame(gameTitle) {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: gameTitle,
  });
}

// User klik tombol beli di Shopee → AddToCart.
export function trackClickShopee(gameTitle) {
  trackEvent('AddToCart', {
    content_type: 'product',
    content_name: gameTitle,
  });
}

// User klik tombol chat WhatsApp → Contact.
export function trackClickWhatsApp(gameTitle) {
  trackEvent('Contact', {
    content_type: 'product',
    content_name: gameTitle,
  });
}

// User submit form request game → Lead.
export function trackGameRequest(gameTitle) {
  trackEvent('Lead', {
    content_category: 'game_request',
    content_name: gameTitle,
  });
}

// User melakukan pencarian → Search.
export function trackSearch(searchTerm) {
  trackEvent('Search', {
    search_string: searchTerm,
  });
}
