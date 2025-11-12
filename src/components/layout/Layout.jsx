import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Content from "./Content";
import Headbar from "./Headbar";
import { Outlet } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar (shown on lg+) */}
      <div className="hidden lg:flex lg:w-64 bg-gray-800 text-white h-screen sticky top-0 overflow-hidden">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {/* Use fixed inset and transform for slide animation */}
      <div
        className={`fixed inset-0 z-50 lg:hidden pointer-events-none transition-opacity duration-200 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        {/* dim backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeSidebar}
        />

        {/* drawer panel */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-gray-800 text-white shadow-xl transform transition-transform duration-300
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="text-lg font-bold">MyGameON</div>
            <button onClick={closeSidebar} className="p-2 rounded hover:bg-gray-700/60" aria-label="Close menu">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="h-[calc(100vh-56px)] overflow-y-auto">
            <Sidebar />
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Headbar - pass toggle for mobile */}
        <div className="sticky top-0 z-20 bg-white shadow">
          <Headbar onToggleSidebar={toggleSidebar} />
        </div>

        {/* Content and Footer */}
        <div className="flex flex-col flex-1 overflow-y-auto bg-gray-100">
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