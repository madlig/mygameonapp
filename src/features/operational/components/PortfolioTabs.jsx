import React from 'react';
import {
  BarChart3,
  Megaphone,
  Ticket,
  ShoppingCart,
  ClipboardList,
  Table2,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'ads', label: 'Ads Performance', icon: Megaphone },
  { id: 'voucher', label: 'Voucher Analysis', icon: Ticket },
  { id: 'product', label: 'Product Intelligence', icon: ShoppingCart },
  { id: 'dailyops', label: 'Daily Ops', icon: Table2 },
  { id: 'action', label: 'Action Plan', icon: ClipboardList },
];

const PortfolioTabs = ({ activeTab, onTabChange }) => (
  <div className="flex gap-1 p-1 bg-[#111317] border border-[#2A2F39] rounded-xl overflow-x-auto">
    {TABS.map(({ id, label, icon: Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
            active
              ? 'bg-[#FFD100]/10 text-[#FFD100] border border-[#FFD100]/25'
              : 'text-[#7E8796] hover:text-[#C8CFDA] hover:bg-[#1A1F27] border border-transparent'
          }`}
        >
          <Icon size={15} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      );
    })}
  </div>
);

export default PortfolioTabs;
