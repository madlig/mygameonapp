import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Content from './Content';
import Headbar from './Headbar';
import { Outlet } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      {/* Desktop Sidebar (shown on lg+) */}
      <div className="hidden lg:flex lg:w-64 bg-[#111317] text-[#F3F4F6] h-screen sticky top-0 overflow-hidden border-r border-[#2A2F39]">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden pointer-events-none transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        {/* dim backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
        />

        {/* drawer panel */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-[#111317] text-[#F3F4F6] shadow-2xl shadow-black/50 transform transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 h-14 border-b border-[#2A2F39]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#FFD100]/15 border border-[#FFD100]/25 grid place-items-center">
                <svg
                  width="14"
                  height="14"
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
              <span className="text-sm font-bold text-[#F3F4F6]">MyGameON</span>
            </div>
            <button
              onClick={closeSidebar}
              className="p-1.5 rounded-lg hover:bg-[#1A1F27] text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="h-[calc(100vh-56px)] overflow-y-auto">
            <Sidebar onCloseMobile={closeSidebar} />
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Headbar */}
        <div className="sticky top-0 z-20">
          <Headbar onToggleSidebar={toggleSidebar} />
        </div>

        {/* Content and Footer */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Content>
            <Outlet />
          </Content>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
