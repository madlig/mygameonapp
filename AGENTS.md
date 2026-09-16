# MyGameON App (Website) — Workspace Context & Memory

## Identitas & Peran Proyek
Proyek ini adalah website publik **MyGameON** (`https://mygameon.store`), dibangun menggunakan **Vite + React + Tailwind CSS + Firebase/Firestore**, dideploy di **Vercel**.

## Arsitektur & Perilaku Kritis
1. **SPA Routing di Vercel (`vercel.json`)**:
   - `vercel.json` menggunakan rewrite: `{ "source": "/(.*)", "destination": "/index.html" }`.
   - Seluruh request URL (termasuk path yang menyerupai API seperti `/api/sims4/validate`) akan mengembalikan `index.html` (HTTP 200). Backend API Sims 4 sebenarnya berjalan melalui Google Apps Script dan MyGameON Studio Hub.
2. **Fitur-Fitur yang Telah Diterapkan**:
   - **Stream Status Dual-Mode**: Mendukung toggle antara *Auto Schedule* dan *Manual Override* dengan quick switcher dan modal pengaturan.
   - **Ticket Protection Screen**: Auto-lock instan saat countdown timer tiket kedaluwarsa.
   - **VIP & VVIP Overlay Badging**: Desain visual pembeda tier VIP (Gold luxury) dan VVIP (Ruby luxury) pada overlay joki/stream.

## Ekosistem Terkait
- **`c:\mad\thesimslauncher`**: Client launcher desktop Sims 4 (Python/Eel/PyInstaller).
- **`c:\mad\proyek\mygameon-hub`**: Admin desktop app (Next.js/Electron/MongoDB/Google Sheets).
- **`madlig/dlc_database` (GitHub)**: Hosting database DLC (`dlc.json`), mods, dan manifest update launcher.
