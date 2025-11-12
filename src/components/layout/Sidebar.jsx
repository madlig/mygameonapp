import React from "react";
import MenuSection from "./MenuSection.jsx";
import QuickActions from "./QuickActions.jsx";
import { menuConfig } from "./menuConfig.jsx";

const Sidebar = ({ className = "" }) => (
  <div className={`flex flex-col h-full ${className}`}>
    {/* Logo */}
    <div className="h-16 bg-gray-900 flex items-center justify-center font-bold text-xl">
      MyGameON
    </div>

    {/* Main Navigation */}
    <nav className="mt-4 flex-1 overflow-y-auto px-0">
      <MenuSection title="Main" items={menuConfig.main} />
      <MenuSection title="More" items={menuConfig.others} />
    </nav>

    {/* Sticky Quick Actions */}
    <div className="bg-gray-900 pt-4 pb-6 px-4">
      <QuickActions items={menuConfig.shortcuts} />
    </div>
  </div>
);

export default Sidebar;