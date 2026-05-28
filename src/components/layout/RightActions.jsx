import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import NotificationPanel from '../../features/notifications/NotificationPanel';

const RightActions = () => {
  const { items, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      {/* Notification Bell */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 rounded-lg hover:bg-[#1A1F27] text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-[#FFD100] text-[#111317] px-1 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {open && (
          <NotificationPanel
            items={items}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default RightActions;
