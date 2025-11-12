import React from "react";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "./TitleMapper";
import RightActions from "./RightActions";
import { Bars3Icon } from "@heroicons/react/24/outline";

const Headbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="h-16 bg-gray-800 flex items-center justify-between px-3 sm:px-4 text-white shadow">
      <div className="flex items-center space-x-3">
        {/* Hamburger hanya tampil di layar kecil */}
        {typeof onToggleSidebar === "function" && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-700/60 transition"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        )}

        {/* Dynamic Title */}
        <h1 className="text-lg sm:text-2xl font-bold tracking-wide truncate">
          {currentTitle}
        </h1>
      </div>

      {/* Right Section */}
      <RightActions />
    </div>
  );
};

export default Headbar;