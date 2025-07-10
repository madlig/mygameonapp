import React from "react";
import { NavLink } from "react-router-dom";

const MenuSection = ({ title, items }) => (
  <div>
    <div className="px-6 py-2 text-gray-400 uppercase text-xs tracking-wider">{title}</div>
    {items.map((item, index) =>
      item.disabled ? (
        <div
          key={index}
          className="flex items-center px-6 py-3 text-gray-500 cursor-not-allowed"
        >
          {item.icon && <item.icon className="h-6 w-6" />}
          <span className="ml-4">{item.label}</span>
        </div>
      ) : (
        <NavLink
          key={index}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center px-6 py-3 hover:bg-gray-700 transition ${
              isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
            }`
          }
        >
          {item.icon && <item.icon className="h-6 w-6" />}
          <span className="ml-4">{item.label}</span>
        </NavLink>
      )
    )}
  </div>
);

export default MenuSection;
