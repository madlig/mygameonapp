import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const RightActions = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Notifikasi */}
      <button
        className="relative p-2 rounded-lg hover:bg-[#1A1F27] text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFD100] rounded-full" />
      </button>
    </div>
  );
};

export default RightActions;
