import React from 'react';
import OverlayActiveSlots from './OverlayActiveSlots';
import OverlayQueue from './OverlayQueue';
import OverlayLeaderboard from './OverlayLeaderboard';

const OverlaySplitSidebar = ({ 
  customers = [], 
  queue = [], 
  now = Date.now(), 
  theme = 'neon',
  scale = 'compact',
  workspaceName = 'Live Joki'
}) => {
  return (
    <div className="w-full max-w-[420px] space-y-3 font-sans select-none">
      {/* 1. Active Slots Section */}
      <OverlayActiveSlots 
        customers={customers} 
        now={now} 
        theme={theme} 
        scale={scale} 
        title={`${workspaceName} • SLOTS`}
      />

      {/* 2. Queue Section */}
      <OverlayQueue 
        queue={queue} 
        theme={theme} 
        scale={scale} 
        maxItems={4} 
        title="DAFTAR ANTRIAN"
      />

      {/* 3. Top Sultan Section */}
      <OverlayLeaderboard 
        customers={customers} 
        theme={theme} 
        scale={scale} 
        maxItems={3} 
        showPodium={false} 
        title="SULTAN TERLOYAL"
      />
    </div>
  );
};

export default OverlaySplitSidebar;
