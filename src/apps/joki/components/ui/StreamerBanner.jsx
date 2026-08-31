import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { EyeOff, AlertOctagon, Coffee, Moon, Megaphone, Settings2 } from 'lucide-react';
import { computeLiveStatus } from '../../services/jokiFirebase';

export const StreamerBanner = ({ onOpenSettings }) => {
  const { 
    streamerMode, 
    globalPaused, 
    isAdmin, 
    globalSettings, 
    activeWorkspace, 
    activeWorkspaceId,
    customers, 
    updateJokiSettings, 
    addToast 
  } = useJoki();

  const [_now, setNow] = useState(Date.now());
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Periodically evaluate live time range (every 10s)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const liveState = computeLiveStatus(globalSettings, customers);
  const streamStatus = liveState.status;
  const streamerName = activeWorkspace?.name || 'Streamer';
  const customNote = globalSettings?.nextStreamSchedule?.trim();
  const currentMode = globalSettings?.statusMode || (globalSettings?.manualOverride ? 'manual' : 'auto');

  // Determine main headline text & style
  const isLive = streamStatus === 'LIVE';
  const isBreak = streamStatus === 'BREAK';

  // Fast 1-Click Quick Status Switcher for Streamer
  const handleQuickStatusChange = async (targetMode, targetManualStatus) => {
    if (!isAdmin || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      if (targetMode === 'auto') {
        await updateJokiSettings(activeWorkspaceId, {
          statusMode: 'auto',
          manualOverride: false,
          updatedAt: Date.now()
        });
        addToast('🤖 Mode status siaran diubah ke OTOMATIS (Mengikuti Jam Rutin)', 'info');
      } else {
        await updateJokiSettings(activeWorkspaceId, {
          statusMode: 'manual',
          manualStatus: targetManualStatus,
          manualOverride: true,
          streamStatus: targetManualStatus,
          updatedAt: Date.now()
        });
        const label = targetManualStatus === 'LIVE' 
          ? '🔴 SEDANG LIVE STREAMING' 
          : targetManualStatus === 'BREAK' 
          ? '☕ SEDANG BREAK / ISTIRAHAT' 
          : '😴 OFF STREAM';
        addToast(`🎯 Status siaran manual diubah ke: ${label}`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah status siaran.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="mb-4">
      {/* SINGLE UNIFIED MASTER BROADCAST BANNER */}
      <div className={`p-3 md:p-3.5 rounded-2xl border shadow-lg backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all ${
        isLive 
          ? 'bg-gradient-to-r from-accent-red/20 via-accent-purple/15 to-[#12131a] border-accent-red/35'
          : isBreak
          ? 'bg-accent-orange/15 border-accent-orange/35'
          : 'bg-bg-surface/90 border-border-default'
      }`}>
        
        {/* Left Side: Status Icon, Title & Dynamic Announcement */}
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

            {/* Mode Tag */}
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
              {currentMode === 'auto' ? '🤖 AUTO (JAM)' : '🎯 MANUAL'}
            </span>

            {/* Dynamic Announcement Note */}
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

        {/* Right Side: Quick Status Switcher & Badges */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Global Pause Badge */}
          {globalPaused && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent-red/20 border border-accent-red/40 text-accent-red text-[11px] font-black animate-pulse">
              <AlertOctagon size={12} />
              <span>BILLING DIJEDA</span>
            </div>
          )}

          {/* Streamer Mode Sensor Badge */}
          {streamerMode && isAdmin && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent-purple/20 border border-accent-purple/40 text-accent-purple-light text-[11px] font-bold">
              <EyeOff size={12} />
              <span>SENSOR OBS</span>
            </div>
          )}

          {/* Admin Quick Live Status Switcher (1-Click) */}
          {isAdmin && (
            <div className="flex items-center gap-1 p-0.5 bg-black/50 border border-white/10 rounded-xl">
              {/* Button: Auto */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('auto')}
                title="Ikuti jam live streaming otomatis"
                disabled={updatingStatus}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  currentMode === 'auto'
                    ? 'bg-accent-purple text-white shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto
              </button>

              {/* Button: Live */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('manual', 'LIVE')}
                title="Paksa status Sedang Live"
                disabled={updatingStatus}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  currentMode === 'manual' && streamStatus === 'LIVE'
                    ? 'bg-rose-500 text-white shadow font-black animate-pulse'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                🔴 Live
              </button>

              {/* Button: Break */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('manual', 'BREAK')}
                title="Paksa status Istirahat / Break"
                disabled={updatingStatus}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  currentMode === 'manual' && streamStatus === 'BREAK'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                ☕ Break
              </button>

              {/* Button: Off */}
              <button
                type="button"
                onClick={() => handleQuickStatusChange('manual', 'OFFLINE')}
                title="Paksa status Off Stream"
                disabled={updatingStatus}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                  currentMode === 'manual' && streamStatus === 'OFFLINE'
                    ? 'bg-slate-700 text-white shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                😴 Off
              </button>
            </div>
          )}

          {/* Settings Modal Button */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              title="Atur jam live harian, pengumuman, dan tarif layanan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-default hover:border-accent-cyan/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Settings2 size={12} className="text-accent-cyan" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const StreamStatus = () => {
  return null;
};
