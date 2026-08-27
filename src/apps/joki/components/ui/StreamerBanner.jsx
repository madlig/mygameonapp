import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { EyeOff, AlertOctagon, Coffee, Moon, Clock, Radio, Megaphone, Edit3 } from 'lucide-react';
import { computeLiveStatus } from '../../services/jokiFirebase';

export const StreamerBanner = ({ onOpenSettings }) => {
  const { streamerMode, globalPaused, isAdmin, globalSettings, activeWorkspace, customers } = useJoki();
  const [now, setNow] = useState(Date.now());

  // Periodically evaluate live time range
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const liveState = computeLiveStatus(globalSettings, customers);
  const streamStatus = liveState.status;
  const streamerName = activeWorkspace?.name || 'Streamer';
  const customNote = globalSettings?.nextStreamSchedule?.trim();

  // Determine main headline text & style
  const isLive = streamStatus === 'LIVE';
  const isBreak = streamStatus === 'BREAK';

  return (
    <div className="mb-4">
      {/* SINGLE UNIFIED MASTER BROADCAST BANNER (Satu Garis Elegan) */}
      <div className={`p-3 md:p-3.5 rounded-2xl border shadow-lg backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
        isLive 
          ? 'bg-gradient-to-r from-accent-red/20 via-accent-purple/15 to-[#12131a] border-accent-red/35'
          : isBreak
          ? 'bg-accent-orange/15 border-accent-orange/35'
          : 'bg-bg-surface/90 border-border-default'
      }`}>
        
        {/* Left Side: Status Icon, Title & Dynamic Announcement (Riyan's editable text) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          {/* Status Indicator Icon */}
          {isLive ? (
            <span className="w-2.5 h-2.5 rounded-full bg-accent-red animate-ping shrink-0 ml-1" />
          ) : isBreak ? (
            <Coffee size={15} className="text-accent-orange shrink-0" />
          ) : (
            <Moon size={15} className="text-accent-purple-light shrink-0" />
          )}

          {/* Status Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-white uppercase tracking-wide">
              {isLive 
                ? `🔴 ${streamerName.toUpperCase()} SEDANG LIVE`
                : isBreak
                ? '☕ STREAMER BREAK'
                : `STATUS: OFF STREAM`}
            </span>

            {/* Dynamic Announcement Note (Editable by Riyan) */}
            <span className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
              <span className="text-border-muted">•</span>
              {customNote ? (
                <span className="text-accent-cyan font-bold flex items-center gap-1">
                  <Megaphone size={12} className="text-accent-yellow shrink-0" />
                  <span>{customNote}</span>
                </span>
              ) : (
                <span className="text-text-dim">
                  {liveState.subtext}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right Side: Badges (Sensor ON, Global Pause) & Edit Button */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Global Pause Badge (Merged inside single banner) */}
          {globalPaused && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent-red/20 border border-accent-red/40 text-accent-red text-[11px] font-black animate-pulse">
              <AlertOctagon size={12} />
              <span>BILLING DIJEDA</span>
            </div>
          )}

          {/* Streamer Mode Sensor Badge (Merged inside single banner) */}
          {streamerMode && isAdmin && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent-purple/20 border border-accent-purple/40 text-accent-purple-light text-[11px] font-bold">
              <EyeOff size={12} />
              <span>SENSOR OBS AKTIF</span>
            </div>
          )}

          {/* Quick Edit Schedule & Announcement Button */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              title="Edit jam live & isi catatan pengumuman yang muncul di banner ini"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-default hover:border-accent-cyan/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Edit3 size={11} className="text-accent-cyan" />
              <span>Edit Pengumuman</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const StreamStatus = () => {
  // Merged into StreamerBanner to eliminate 3 stacked strips
  return null;
};
