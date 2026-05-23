import React from 'react';
import { NavLink } from 'react-router-dom';

const MenuSection = ({ title, items, onNavigate }) => (
  <div>
    <div className="px-3 mb-1.5 text-[10px] font-semibold text-[#7E8796] uppercase tracking-widest">
      {title}
    </div>
    <div className="space-y-0.5">
      {items.map((item, index) =>
        item.disabled ? (
          <div
            key={index}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#7E8796]/50 cursor-not-allowed"
          >
            {item.icon && <item.icon className="w-[18px] h-[18px]" />}
            <span className="text-sm">{item.label}</span>
            <span className="ml-auto text-[9px] font-medium bg-[#2A2F39] text-[#7E8796] px-1.5 py-0.5 rounded">
              Soon
            </span>
          </div>
        ) : (
          <NavLink
            key={index}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#FFD100]/10 text-[#FFD100] border border-[#FFD100]/20'
                  : 'text-[#C8CFDA] hover:bg-[#1A1F27] hover:text-[#F3F4F6] border border-transparent'
              }`
            }
          >
            {item.icon && (
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </NavLink>
        )
      )}
    </div>
  </div>
);

export default MenuSection;
