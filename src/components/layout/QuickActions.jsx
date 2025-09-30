import React from "react";
import { NavLink } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";

const QuickActions = ({ items }) => (
  <div className="bg-gray-900 p-4 space-y-3 rounded-lg shadow-md">
    <div className="text-gray-400 uppercase text-xs tracking-wider mb-2">Quick Actions</div>
    {items.map((item, index) => (
      <NavLink
        key={index}
        to={item.path}
        className={`flex items-center px-4 py-2 rounded text-white text-sm font-medium shadow transition ${item.color}`}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        {item.label}
      </NavLink>
    ))}
  </div>
);

export default QuickActions;
