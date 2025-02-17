import React from "react";
import MenuSection from "./MenuSection";
import QuickActions from "./QuickActions";
import { menuConfig } from "./menuConfig";

const Sidebar = () => (
  <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
    {/* Logo */}
    <div className="h-16 bg-gray-900 flex items-center justify-center font-bold text-xl">
      MyGameON
    </div>

    {/* Main Navigation */}
    <nav className="mt-4 flex-1 overflow-y-auto">
      <MenuSection title="Main" items={menuConfig.main} />
      <MenuSection title="More" items={menuConfig.others} />
    </nav>

    {/* Sticky Quick Actions */}
    <div className="bg-gray-900 pt-4 pb-12">
      <QuickActions items={menuConfig.shortcuts} />
    </div>
  </div>
);

export default Sidebar;
