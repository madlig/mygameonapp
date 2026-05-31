# Handoff: MyGameON Landing & Public Pages — Full Redesign

## Overview

Redesign lengkap semua halaman publik (landing page + subpages) MyGameON dari desain lama yang utilitarian menjadi **dark gaming aesthetic** dengan visual identity yang kuat. Desain ini mencakup 6 halaman: Landing Page, Blog, FAQ, Request Game, Cek Status Request, dan Video Tutorial.

## About the Design Files

File-file dalam bundle ini adalah **design reference yang dibuat dalam HTML/React (inline JSX)** — prototype yang menunjukkan tampilan dan perilaku yang diinginkan. **Bukan production code untuk dicopy langsung.**

Tugas: **Recreate desain HTML ini di dalam codebase yang sudah ada** (`mygameonapp/`) menggunakan React + Vite + TailwindCSS + library yang sudah terinstall. Pertahankan semua koneksi Firebase/Firestore yang sudah berjalan — hanya ubah tampilan visual dan layout, bukan business logic.

## Fidelity

**High-fidelity (hifi)**. Desain ini adalah pixel-perfect mockup dengan warna final, tipografi, spacing, dan interaksi. Developer harus mereproduksi UI seakurat mungkin menggunakan TailwindCSS dan library yang sudah ada di codebase.

---

## Tech Stack (Existing Codebase)

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite |
| Styling | TailwindCSS 3 |
| Routing | react-router-dom v7 |
| Backend | Firebase/Firestore |
| UI Libraries | @headlessui/react, lucide-react, @heroicons/react |
| Search | Fuse.js (game catalog), Algolia (ada tapi belum fully dipakai di landing) |
| Forms | react-hook-form + yup |
| State | React useState/useEffect + React Query |
| Images | react-lazy-load-image-component |

## Route Mapping

| Design File | Route | Existing File |
|---|---|---|
| `Landing Page v2.html` | `/` | `src/features/landing/LandingPage.jsx` |
| `Blog.html` | `/blog` (BARU) | **Buat baru** — belum ada di AppRouter |
| `FAQ.html` | `/faq` | `src/features/landing/FaqPage.jsx` |
| `Request Game.html` | `/request-game` | `src/features/landing/RequestGamePage.jsx` |
| `Cek Status Request.html` | `/request-status` | `src/features/landing/RequestStatusPage.jsx` |
| `Tutorial Video.html` | `/videos` | `src/features/landing/VideosPage.jsx` |

**Catatan Blog:** Halaman Blog belum ada di codebase. Perlu tambah route `/blog` di `AppRouter.jsx` dan buat `BlogPage.jsx` baru. Data artikel untuk sementara bisa hardcoded, nanti bisa dimigrasikan ke Firestore collection `articles`.

---

## Design System / Visual Language

### Font

```
Font Family: 'Plus Jakarta Sans'
Weights: 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold/heading)
Import: Google Fonts — sudah ada di codebase, pastikan weight 800 terinclude
```

**Tambahkan ke `tailwind.config.js`:**
```js
theme: {
  extend: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
    },
  },
},
```

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| **bg-primary** | `#0D0F14` | Background utama body/section |
| **bg-secondary** | `#080A0E` | Background card, input, alt sections |
| **bg-surface** | `#111317` | Surface/elevated panels |
| **border-default** | `#151920` | Border card/input default |
| **border-subtle** | `#1A1F27` | Border lebih halus |
| **border-muted** | `#1F2937` | Border nav/divider |
| **border-highlight** | `#111317` | Border untuk footer divider |
| **text-primary** | `#F3F4F6` | Heading utama, text utama |
| **text-secondary** | `#E5E7EB` | Heading card |
| **text-muted** | `#C8CFDA` | Label, meta text |
| **text-tertiary** | `#6B7280` | Paragraph, description |
| **text-dim** | `#4B5563` | Subtitle, body text halaman |
| **text-faint** | `#374151` | Detail kecil, meta |
| **text-ghost** | `#2A2F39` | Counter, ultra-subtle |
| **text-hidden** | `#1F2937` | Footer text, nearly invisible |
| **accent-yellow** | `#FFD100` | Primary CTA, brand, heading accent |
| **accent-purple** | `#8B5CF6` | Secondary accent, badge, eyebrow |
| **accent-purple-light** | `#A78BFA` | Purple text lighter variant |
| **accent-orange** | `#F97316` | Tag "Populer", blog "News" |
| **accent-red** | `#EF4444` | Tag "Update", "HOT", destructive |
| **accent-green** | `#22C55E` | WhatsApp, success |
| **accent-green-dark** | `#15803D` | WhatsApp CTA button bg |
| **accent-cyan** | `#22D3EE` | Tracking, tutorial accent |
| **accent-emerald** | `#10B981` | Success messages |
| **shopee-orange** | `#EE4D2D` | Shopee button |

### Spacing & Sizing

```
Max content width: 1200px (landing), 1100px (blog), 960px (subpages), 880px (videos)
Section padding: 0 24px 80px (horizontal 24px, vertical gap ~80px)
Card border-radius: 14-16px (cards), 10-12px (buttons/input), 100px (pills/nav)
Card border: 1px solid #151920 (default), hover → accent color at 25-40% opacity
Nav pill border-radius: 100px (fully round)
Input padding: 12px 14px
Button padding: 13-14px 24-26px
Gap between grid items: 10-12px
```

### Shadows & Effects

```
Card hover shadow: 0 12px 36px rgba(0,0,0,0.5)
Backdrop blur (nav): blur(24px) saturate(200%)
Glow orbs: blur(100-120px), 18% opacity purple, 12% opacity yellow
Noise texture overlay: fractalNoise SVG at 2.5% opacity
Dot grid pattern: radial-gradient 1px dots at 32px intervals, #FFD100 at 8% opacity
```

### Animations

```css
/* Hero entrance */
@keyframes heroIn {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.8s, easing: cubic-bezier(0.22, 1, 0.36, 1), stagger: 0.15s */

/* Marquee scroll */
@keyframes marqueeScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}
/* Duration: 30s, linear, infinite */

/* Glow float */
@keyframes glowFloat {
  0%, 100% { opacity: 0.5; transform: scale(1) translateY(0); }
  50% { opacity: 0.8; transform: scale(1.06) translateY(-12px); }
}
/* Duration: 8-10s, ease-in-out, infinite */

/* Subpage slide-in */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.5s, stagger: 0.08s */
```

### Hover & Interaction States

```
Card hover: translateY(-3px to -4px), border-color → accent at 25-40% opacity
Button .btn-yellow hover: filter brightness(0.92)
Button .btn-yellow active: transform scale(0.97)
Nav link hover: color → #F3F4F6, background → rgba(255,255,255,0.05)
Input focus: border-color → rgba(255,209,0,0.35)
All transitions: 0.15-0.22s ease
```

---

## Screens / Views — Detailed Specs

---

### 1. Landing Page (`/`)

**File referensi:** `Landing Page v2.html` + `lp-hero.jsx` + `lp-sections.jsx`

#### 1A. Marquee Ticker (Fixed, top: 0)
- **Height:** 32px, fixed top, z-index: 300
- **Background:** `#080A0E`, border-bottom: 1px solid `#111317`
- **Content:** Array of items dengan tag badge + text, scrolling infinite
- **Tag colors:** NEW → `#FFD100`, HOT → `#EF4444`, DROP → `#8B5CF6`, TOP → `#F97316`, INFO/LIVE → `rgba(255,255,255,0.1)` bg
- **Tag font:** 9px, weight 800, letterSpacing 0.8px, padding 2px 7px
- **Text font:** 11.5px, weight 500, color `#4B5563`
- **Animation:** `marqueeScroll 30s linear infinite`, content tripled for seamless loop
- **Catatan:** Di codebase baru bisa diisi dari Firestore collection (e.g. `announcements`)

#### 1B. Floating Pill Navbar (Fixed, z-index: 250)
- **Layout:** Centered pill, max-width 880px, border-radius 100px
- **Background (default):** `rgba(8,10,14,0.55)`, border `rgba(255,255,255,0.04)`
- **Background (scrolled, >50px):** `rgba(8,10,14,0.96)`, border `rgba(255,255,255,0.08)`
- **Padding:** 8px 10px 8px 14px
- **Logo:** 28x28px yellow square (`#FFD100`), border-radius 7px, text "MG" 10px weight 900
- **Brand text:** 14px weight 800, color `#F3F4F6`, letter-spacing -0.4px
- **Nav links:** 12.5px weight 500, color `#4B5563`, padding 6px 13px, border-radius 100px
- **Links:** Katalog (#catalog), Blog (Blog page), Tutorial (Videos page), FAQ (FAQ page)
- **Right buttons:**
  - "Hubungi" → border 1px solid `#1F2937`, 12px weight 600, color `#6B7280`
  - "+ Request" → bg `#FFD100`, 12px weight 800, color `#0D0F14`
- **Responsive:** Hide nav links pada ≤900px
- **Backdrop filter:** blur(24px) saturate(200%)

#### 1C. Hero Section
- **Min-height:** 100vh, centered content, paddingTop 110px
- **Backgrounds:**
  - Dot grid pattern (background-image radial-gradient, 32px repeat)
  - Purple glow orb: top 8%, left -5%, 480x480px, `rgba(139,92,246,0.18)`, blur 120px, animasi glowFloat 8s
  - Yellow glow orb: bottom 5%, right -3%, 360x360px, `rgba(255,209,0,0.12)`, blur 100px, animasi glowFloat 10s reverse
  - Noise texture SVG overlay, 2.5% opacity
- **Eyebrow badge:** inline-flex, bg `rgba(139,92,246,0.08)`, border `rgba(139,92,246,0.2)`, border-radius 100px
  - Inner tag: bg `#8B5CF6`, text "BARU", 9px weight 800
  - Text: color `#A78BFA`, 12px weight 600
- **Headline:** clamp(36px, 5.5vw, 72px), weight 800, line-height 1.0, letter-spacing -2.5px
  - Line 1: "Semua Game PC" — color `#F3F4F6`
  - Line 2: "Satu Tempat." — gradient text `#FFD100` → `#F97316`
- **Subtitle:** clamp(14px, 1.3vw, 17px), color `#6B7280`, line-height 1.75, max-width 540px
- **CTA buttons:**
  - Primary: "Cari Game ↓" — bg `#FFD100`, 15px weight 800, border-radius 12px, padding 14px 26px
  - Secondary: "Request Game" — bg `rgba(139,92,246,0.1)`, border `rgba(139,92,246,0.25)`, color `#A78BFA`
- **Stats row:** 3 stat cards — bg `rgba(255,255,255,0.03)`, border `#1A1F27`, border-radius 10px
  - Number: 22px weight 800, color `#FFD100`
  - Label: 10.5px weight 500, color `#4B5563`
  - Stats: "500+ Game Tersedia", "2.4K Request Diproses", "4.9 Rating Shopee"
- **Bottom gradient:** linear-gradient transparent → `#0D0F14`, height 120px
- **Parallax:** Dot grid translateY pada scroll (factor 0.22)

#### 1D. Winning Product Spotlight
- **Section header:** Yellow bar 3x24px + "WINNING PRODUCT" text `#FFD100` 13px weight 800, letter-spacing 2px
- **Card:** 2-column grid, border-radius 20px, border 1px solid `#1A1F27` (hover → `rgba(139,92,246,0.3)`)
- **Left (visual):** Purple gradient bg (`#1a0533` → `#3b0764` → `#581c87`), radial glow overlay
  - Large faded title text: "CYBERPUNK" at 10% opacity
  - Sticker badges (rotated -2deg): "BESTSELLER" (yellow), "BARU UPDATE" (red)
  - Price badge: bottom-right, backdrop blur, old price strikethrough + new price in yellow 22px weight 900
- **Right (info):**
  - Genre: 10px weight 600, color `#8B5CF6`, letter-spacing 1.5px uppercase
  - Title: clamp(24px, 2.8vw, 36px) weight 900, letter-spacing -1.2px
  - Subtitle: 14px weight 500, color `#6B7280`
  - Description: 13.5px, color `#4B5563`, line-height 1.7
  - CTA row: Shopee button (`#EE4D2D`) + WhatsApp icon button (`#15803D`)
  - Meta: "70.8 GB · Windows 10+ · Instant delivery" — 11px color `#374151`
- **Data source:** Bisa hardcode dulu, nanti buat Firestore field `isFeatured: true` di games collection

#### 1E. Bento Features Grid
- **Header:**
  - Eyebrow: "Kenapa MyGameON?" — `#8B5CF6` 11px weight 700, letter-spacing 2.5px uppercase
  - Title: clamp(24px, 3vw, 40px) weight 900, "Dibuat untuk gamer\nyang nggak mau ribet."
- **Grid:** 4 columns, 2 rows, gap 10px
  - Cell 1: `span 2` columns (wide) — accent `#FFD100`
  - Cell 2: `span 2` rows (tall) — accent `#8B5CF6` — includes example box
  - Cell 3: normal — accent `#22D3EE`
  - Cell 4: normal — accent `#22C55E`
- **Cell style:** bg `#0D0F14`, border `#151920`, border-radius 16px, padding 24px
  - Icon box: 36x36px, border-radius 9px, bg accent at 7% + border accent at 15%
  - Icon number: 11px weight 900, color = accent
  - Title: 15.5-18px weight 800, color `#E5E7EB`
  - Body: 13px color `#4B5563`, line-height 1.65
  - Hover: border-color → accent at 25%, box-shadow `0 0 32px accent at 8%`
- **Responsive:** 2 columns at ≤900px, 1 column at ≤600px

#### 1F. Game Catalog
- **Header:** "Katalog" eyebrow (11px `#2A2F39`) + "Koleksi Game" heading + game count
- **Search input:** bg `#080A0E`, border `#151920`, border-radius 11px, focus border → `rgba(255,209,0,0.35)`, search icon left
- **Grid:** `repeat(auto-fill, minmax(185px, 1fr))`, gap 10px
- **Card:**
  - Aspect 4:3 cover area with gradient bg per game
  - Genre label + title overlay at bottom of cover
  - Badge (optional): "POPULER" (orange), "UPDATE" (red)
  - Body: title 13px weight 700, tags (9.5px pills), file size
  - CTA: Shopee button (`#EE4D2D`) + WhatsApp icon (`#15803D`)
  - Hover: translateY(-4px), border `rgba(255,209,0,0.25)`, shadow
- **Empty state:** "Tidak ditemukan." + "Request Game Ini" yellow button
- **PENTING:** Pertahankan koneksi Firestore yang sudah ada di `GameCatalogSection`. Hanya ubah visual/layout.

#### 1G. Blog & News Section
- **Background:** `#080A0E`, border-top/bottom `#111317`
- **Header:** "Blog & Update" eyebrow (orange) + heading + "Lihat Semua →" link
- **Grid:** `repeat(auto-fill, minmax(260px, 1fr))`, gap 12px
- **Card:** bg `#0D0F14`, border `#151920`, border-radius 14px, padding 22px 20px
  - Tag badge: colored bg at 10%, colored text
  - Date: 10.5px color `#2A2F39`
  - Title: 15.5px weight 800, color `#E5E7EB`
  - Excerpt: 12.5px color `#4B5563`, line-height 1.65
  - Footer: readTime + "Baca →" colored link
  - Hover: border accent, translateY(-3px)
- **Data:** Hardcode 4 artikel dulu, nanti migrasi ke Firestore `articles` collection

#### 1H. CTA Banner
- **Background:** gradient `#0D0F14` → `#110D1E`, border `rgba(139,92,246,0.15)`, border-radius 20px
- **Glow orbs:** Purple top-right, yellow bottom-left (blur)
- **Layout:** flex space-between, wrap
- **Title:** "Game Belum Ada?\nRequest Sekarang." — `#FFD100` accent on second line
- **Buttons:** "Kirim Request" yellow + "Cek Status" border outline

#### 1I. Contact Section
- **2-column grid:**
  - WhatsApp card: green icon, "Chat WhatsApp", "Hubungi" button bg `#15803D`
  - FAQ card: yellow icon, "FAQ & Tutorial", "Lihat FAQ" button outline yellow

#### 1J. Footer
- **Background:** `#080A0E`, border-top `#0F1115`
- **Layout:** Logo + description left, nav links right (2 columns: Navigasi + Bantuan)
- **Logo text:** weight 800, 14px, color `#2A2F39`
- **Links:** 12px color `#1F2937`, hover → `#6B7280`
- **Copyright:** 11px color `#151920`
- **Admin link:** 10px, href `/login`

---

### 2. Blog Page (`/blog`) — HALAMAN BARU

**File referensi:** `Blog.html`

- **Navbar:** Custom (bukan PageShell) — Logo + "Blog" button + "Katalog" link + "+ Request" button
- **Header:** "Blog & Update" gradient text (orange→red), subtitle
- **Category bar:** Pills: Semua, Update, News, Tips, Tutorial — yellow active, dark inactive
- **Search:** Right-aligned search input
- **Featured hero:** 2-column grid (cover gradient left, content right), hanya muncul di "Semua" tanpa search
- **Article grid:** `repeat(auto-fill, minmax(250px, 1fr))`, gap 12px
- **Sidebar (280px):** Trending list + Tags cloud + CTA card
- **Article reader view:** In-page navigation (useState, bukan route terpisah)
  - Back button, cover gradient, meta, title, body dengan markdown-like rendering (## heading, **bold**, bullet)
  - Related articles di bawah
- **Responsive:** 1 column grid pada ≤900px, hide sidebar
- **Route:** Tambahkan di `AppRouter.jsx`: `<Route path="/blog" element={<BlogPage />} />`

---

### 3. FAQ Page (`/faq`)

**File referensi:** `FAQ.html`

- **Shell:** Menggunakan shared PageShell (sticky nav + "Kembali" + title + logo)
- **Max-width:** 680px centered
- **Header:** "Pertanyaan Umum" — "Umum" in `#FFD100`
- **Search:** Full-width, icon left, focus border yellow
- **Category pills:** Semua, Pembelian, Request, Produk, Troubleshoot, Support
  - Active: bg `#FFD100`, color `#0D0F14`
  - Inactive: bg `#080A0E`, border `#151920`, color `#4B5563`
- **Accordion items:**
  - Background: `#080A0E`, border `#151920`, border-radius 14px
  - Open state: border → `rgba(255,209,0,0.2)`
  - Category badge: bg `rgba(139,92,246,0.1)`, color `#A78BFA`, 9px
  - Question: 14px weight 700, color `#E5E7EB`
  - Answer: 13.5px color `#6B7280`, line-height 1.7
  - Chevron rotates 180deg saat open
- **Question form:** bg `#080A0E`, border `#151920`, border-radius 16px
  - 2 column inputs (name + email), textarea, submit button yellow
  - WhatsApp link di footer form
- **PENTING:** Pertahankan koneksi `loadActiveFaqs()` dan `submitUserQuestion()` dari Firestore

---

### 4. Request Game Page (`/request-game`)

**File referensi:** `Request Game.html`

- **Shell:** PageShell
- **Max-width:** 520px centered
- **Eyebrow badge:** Purple pill "FORM" + "Tanpa login, proses cepat"
- **Header:** "Request Game Baru" — "Baru" in `#FFD100`
- **Card:** bg `#080A0E`, border `#151920`, border-radius 18px
- **Info box:** Yellow icon + instructions, border-bottom separator
- **Success notification:** Green bg, tracking code (monospace, yellow `#FFD100`), copy button, "Cek Status →" link
- **Form fields:**
  - Judul Game (required): icon left, placeholder
  - Username Shopee (required)
  - Nomor WhatsApp (required): hint text below
  - Catatan (optional): textarea 2 rows
- **Submit button:** Full-width, bg `#FFD100`, weight 800, spinner saat loading
- **Bottom link:** "Sudah pernah request? Cek status di sini →"
- **PENTING:** Pertahankan semua Firebase logic: duplikat detection, vote increment, tracking code, rate limiting, honeypot

---

### 5. Cek Status Request (`/request-status`)

**File referensi:** `Cek Status Request.html`

- **Shell:** PageShell
- **Max-width:** 580px centered
- **Search card:** Input monospace + "Cek Status" yellow button
- **Error state:** Red bg/border notification
- **Result card:** bg `#080A0E`, border `#151920`, border-radius 16px
  - Title bar: Game title + status badge (`#FFD100`) + copy tracking code button
  - Shopee link (completed): Full-width yellow button with cart icon
  - Rejected state: Red notification box
  - Timeline: Vertical stepper
    - Done: circle bg `#FFD100` with checkmark, connecting line `rgba(255,209,0,0.2)`
    - Current: circle bg `#FFD100`, label color `#FFD100`
    - Upcoming: circle bg `#111317`, border `#1F2937`, line `#151920`
    - Labels: 13.5px weight 700, descriptions: 11.5px
  - Supports RDP timeline (5 steps) vs direct (4 steps)
  - Footer: 10px status update note
- **PENTING:** Pertahankan Firestore query, auto-lookup dari URL params, localStorage tracking code

---

### 6. Video Tutorial (`/videos`)

**File referensi:** `Tutorial Video.html`

- **Shell:** PageShell
- **Max-width:** 880px centered
- **Header:** "Video Tutorial" — "Tutorial" in `#8B5CF6`
- **Category filter:** Pills with color per category (yellow=Semua, purple=Umum, cyan=Sims 4, orange=Troubleshoot)
  - Active: colored bg, inner dot 6px
- **Stats row:** 2 stat pills — tutorial count + total duration
- **Video card grid:** `repeat(auto-fill, minmax(300px, 1fr))`, gap 14px
- **Video card:**
  - Thumbnail: aspect 16:9, gradient bg, centered play button (56px circle, colored)
  - Duration badge: bottom-right, backdrop blur
  - "SEGERA HADIR" badge: top-left, pulsing dot (jika belum ada youtubeId)
  - Pattern overlay dots
  - Body: category tag, title 15px weight 800, description 12.5px
  - Hover: translateY(-3px), border → color at 20%
- **Bottom CTA:** "Masih bingung?" + WhatsApp button green
- **PENTING:** Pertahankan `tutorialsCRUD.loadActive()` dari Firestore

---

## Shared Components (PageShell)

**File referensi:** `shared-page.jsx`

Buat sebuah shared layout component untuk subpages:

- **Sticky nav:** bg `rgba(13,15,20,0.92)`, backdrop blur, height 56px, border-bottom `#151920`
  - Left: "← Kembali" link (ke `/`) + divider + page title
  - Right: Logo "MG" yellow square + "MyGameON" brand text
- **Content:** max-width container (varies per page) + padding 48px 24px 80px
- **Mini footer:** border-top `#111317`, copyright 11px centered

Shared input style:
```css
width: 100%;
padding: 12px 14px;
background: #080A0E;
border: 1px solid #151920;
border-radius: 10px;
color: #F3F4F6;
font-size: 13.5px;
transition: border-color 0.2s;
/* focus: border-color rgba(255,209,0,0.4) */
```

---

## Implementation Priority

1. **Shared:** PageShell, design tokens di tailwind.config.js, global styles
2. **Landing Page** (terbesar, paling visible)
3. **FAQ Page** (paling simpel subpage)
4. **Request Game Page**
5. **Cek Status Request Page**
6. **Video Tutorial Page**
7. **Blog Page** (paling banyak kerjaan — halaman baru + article reader)

## Hal yang HARUS Dipertahankan dari Codebase Lama

- ✅ Semua Firebase/Firestore connections (game catalog, FAQ, tutorials, prerequisites, requests)
- ✅ Form validation logic (react-hook-form di RequestGamePage)
- ✅ Request status system (`src/shared/requestStatus.js`)
- ✅ Duplicate request detection + vote system
- ✅ Rate limiting (2 min cooldown)
- ✅ Honeypot anti-bot field
- ✅ Tracking code generation + localStorage persistence
- ✅ Auto-lookup from URL params di RequestStatusPage
- ✅ Fuse.js search di Game Catalog
- ✅ Lazy loading images (react-lazy-load-image-component)
- ✅ Semua environment variables (VITE_SHOPEE_STORE_URL, VITE_WHATSAPP_NUMBER)
- ✅ Private routes dan admin layout (tidak diubah)

## Hal yang BARU / Berubah

- 🆕 Marquee ticker di atas navbar
- 🆕 Floating pill navbar (menggantikan sticky bar lama)
- 🆕 Hero section redesign total (centered, gradient text, glow orbs, stats)
- 🆕 Winning Product Spotlight section
- 🆕 Bento Features Grid (menggantikan quick nav lama)
- 🆕 Blog & News section di landing + halaman blog terpisah
- 🆕 CTA Banner section
- 🆕 Contact section (WhatsApp + FAQ cards)
- 🆕 Footer redesign (multi-column)
- 🔄 Game Catalog: sama logic, tapi card design berubah total
- 🔄 FAQ Page: tambah category filter + search, desain accordion baru
- 🔄 Request Game: visual overhaul, eyebrow badge, card wrapper
- 🔄 Cek Status: visual timeline stepper design baru
- 🔄 Video Tutorial: card design baru, category pills berwarna, stats row
- ❌ Downloads Section (dari codebase lama) — tidak ada di design baru, hapus atau sembunyikan
- ❌ Prerequisites Section — tidak ada di design baru
- ❌ Quick Nav grid di hero — diganti Bento Features section

## Files

Semua file design reference ada di folder `design_handoff_landing_redesign/`:

| File | Deskripsi |
|---|---|
| `Landing Page v2.html` | Landing page utama — SEMUA sections |
| `lp-hero.jsx` | Component: MarqueeTicker, NavBar, Hero |
| `lp-sections.jsx` | Component: WinningProduct, BentoFeatures, Catalog, Blog, CTA, Footer |
| `shared-page.jsx` | Shared PageShell, InputField, input styles |
| `Blog.html` | Blog page lengkap + article reader |
| `FAQ.html` | FAQ page dengan accordion + question form |
| `Request Game.html` | Form request game |
| `Cek Status Request.html` | Tracking page dengan timeline stepper |
| `Tutorial Video.html` | Video tutorial grid |
| `tweaks-panel.jsx` | Tweak system (hanya untuk prototype, TIDAK perlu diimplementasi) |

---

## Tips untuk Claude Code

1. **Jangan copy-paste HTML prototype.** Konversikan ke React component proper dengan TailwindCSS classes.
2. **Gunakan Tailwind arbitrary values** untuk warna yang tidak ada di default palette, e.g. `bg-[#0D0F14]`, `text-[#FFD100]`.
3. **Pertahankan semua import dan hook** dari file lama — hanya ubah JSX return dan styling.
4. **Test setiap halaman** setelah perubahan — pastikan Firestore data tetap load.
5. **Responsive breakpoints:** 900px (tablet) dan 600px (mobile) — gunakan Tailwind `md:` dan `sm:`.
6. **Animasi bisa pakai Tailwind `animate-*`** atau custom CSS keyframes di `index.css`.
7. **Untuk Blog page:** Buat file baru `src/features/landing/BlogPage.jsx` dan tambah route di `AppRouter.jsx`.
