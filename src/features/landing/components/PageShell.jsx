import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * PageShell — Shared layout for public subpages (FAQ, Request, Status, Videos).
 * Provides sticky nav with back link, page title, logo, content area, and mini footer.
 *
 * @param {string}  title     — Page title shown in the nav bar
 * @param {number}  maxWidth  — Optional max-width for content (default: 960)
 * @param {React.ReactNode} children
 */
const PageShell = ({ title, maxWidth = 960, children }) => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Sticky nav */}
      <nav className="nav-blur sticky top-0 z-[100] border-b border-border-default bg-[rgba(13,15,20,0.92)]">
        <div
          className="mx-auto flex h-14 items-center justify-between px-6"
          style={{ maxWidth }}
        >
          {/* Left: Back + divider + title */}
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-[13px] font-medium text-text-dim transition-colors hover:text-text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Link>
            <div className="h-4 w-px bg-border-muted" />
            <span className="text-[13px] font-bold text-text-primary">
              {title}
            </span>
          </div>

          {/* Right: Logo */}
          <Link to="/" className="flex items-center gap-[7px] no-underline">
            <img
              src="/logo.png"
              alt="MyGameON"
              className="h-6 w-6 object-contain"
            />
            <span className="text-[13px] font-bold text-text-ghost">
              MyGameON
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto px-6 pb-20 pt-12" style={{ maxWidth }}>
        {children}
      </main>

      {/* Mini footer */}
      <footer className="border-t border-[#111317] py-5 text-center">
        <p className="text-[11px] text-text-hidden">
          &copy; {new Date().getFullYear()} MyGameON Hub
        </p>
      </footer>
    </div>
  );
};

export default PageShell;
