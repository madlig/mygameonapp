// src/features/notifications/NotificationPanel.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const typeConfig = {
  request: {
    icon: ClipboardDocumentListIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
  },
  question: {
    icon: ChatBubbleOvalLeftEllipsisIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
  },
};

const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
};

const NotificationPanel = ({ items, unreadCount, markAllRead, onClose }) => {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    onClose();
    navigate(item.href);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[#2A2F39] bg-[#1A1F27] shadow-2xl shadow-black/40 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2F39]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#F3F4F6]">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-[#FFD100] text-[#111317] px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[11px] font-medium text-[#7E8796] hover:text-[#FFD100] transition-colors"
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Tandai dibaca
          </button>
        )}
      </div>

      {/* Items */}
      <div className="max-h-80 overflow-y-auto">
        {items.length > 0 ? (
          items.map((item) => {
            const cfg = typeConfig[item.type] || typeConfig.request;
            const Icon = cfg.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#111317] transition-colors text-left border-b border-[#2A2F39]/40 last:border-b-0"
              >
                <div
                  className={`mt-0.5 w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} grid place-items-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#F3F4F6] font-medium truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#7E8796] truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <span className="text-[10px] text-[#7E8796] flex-shrink-0 mt-1 whitespace-nowrap">
                  {timeAgo(item.timestamp)}
                </span>
              </button>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <CheckCircleIcon className="w-8 h-8 mx-auto text-[#7E8796] opacity-40 mb-2" />
            <p className="text-sm text-[#7E8796]">Tidak ada notifikasi.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
