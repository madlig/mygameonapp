import React from 'react';
import { useLocation } from 'react-router-dom';
import { getPageTitle } from './TitleMapper';
import RightActions from './RightActions';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Headbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="h-14 bg-[#111317] border-b border-[#2A2F39] flex items-center justify-between px-4 sm:px-6 text-[#F3F4F6]">
      <div className="flex items-center gap-3">
        {/* Hamburger hanya tampil di layar kecil */}
        {typeof onToggleSidebar === 'function' && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#1A1F27] text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}

        {/* Dynamic Title */}
        <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
          {currentTitle}
        </h1>
      </div>

      {/* Right Section */}
      <RightActions />
    </div>
  );
};

export default Headbar;
