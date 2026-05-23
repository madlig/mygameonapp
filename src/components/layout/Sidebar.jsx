import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import MenuSection from './MenuSection.jsx';
import { menuConfig } from './menuConfig.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ onCloseMobile }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const initial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'A';

  return (
    <div className="flex flex-col h-full bg-[#111317]">
      {/* ── Logo ── */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#2A2F39] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#FFD100]/15 border border-[#FFD100]/25 grid place-items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFD100"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="11" x2="10" y2="11" />
            <line x1="8" y1="9" x2="8" y2="13" />
            <line x1="15" y1="12" x2="15.01" y2="12" />
            <line x1="18" y1="10" x2="18.01" y2="10" />
            <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-bold text-[#F3F4F6] tracking-tight">
            MyGameON
          </span>
          <span className="ml-1.5 text-[10px] font-semibold text-[#FFD100] bg-[#FFD100]/10 px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        <MenuSection
          title="Menu Utama"
          items={menuConfig.main}
          currentPath={location.pathname}
          onNavigate={onCloseMobile}
        />
        <MenuSection
          title="Lainnya"
          items={menuConfig.others}
          currentPath={location.pathname}
          onNavigate={onCloseMobile}
        />
      </nav>

      {/* ── Bottom Section ── */}
      <div className="flex-shrink-0 border-t border-[#2A2F39] p-3 space-y-2">
        {/* Back to landing */}
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#7E8796] hover:text-[#F3F4F6] hover:bg-[#1A1F27] transition-colors text-xs font-medium"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1A1F27] border border-[#2A2F39]">
          <div className="w-8 h-8 rounded-full bg-[#FFD100]/15 border border-[#FFD100]/25 grid place-items-center flex-shrink-0">
            <span className="text-xs font-bold text-[#FFD100]">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F3F4F6] truncate">
              {currentUser?.displayName || 'Admin'}
            </p>
            <p className="text-[10px] text-[#7E8796] truncate">
              {currentUser?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-[#7E8796] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            title="Logout"
            aria-label="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
