import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Plus, 
  Pause, 
  Play, 
  Video, 
  VideoOff, 
  LogIn, 
  LogOut, 
  Clock, 
  ShieldCheck, 
  Share2, 
  Check, 
  Crown, 
  Gamepad2,
  Settings
} from 'lucide-react';

const JokiHeader = ({ 
  onOpenAddModal, 
  onOpenLoginModal,
  onOpenManageAdminsModal,
  onOpenSettingsModal,
  onRequestPauseAll, 
  onRequestResumeAll,
}) => {
  const { 
    isAdmin, 
    isSuperAdmin,
    logout,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    changeWorkspace,
    streamerMode, 
    toggleStreamerMode,
    addToast
  } = useJoki();
  
  const [currentTime, setCurrentTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Berhasil logout. Beralih ke mode viewer.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?c=${activeWorkspaceId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast(`Link live board untuk ${activeWorkspace.name} berhasil disalin!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="bg-bg-surface/80 backdrop-blur-xl border border-border-default rounded-3xl p-5 md:p-6 mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-2xl transition-all">
      {/* Left Block: Brand, Streamer Identity & Link/Clock Bar */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-yellow/10 border border-accent-purple/30 flex items-center justify-center text-xl shadow-inner shrink-0">
            🥚
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight m-0">
                Dashboard Joki{' '}
                <span className="bg-gradient-to-r from-accent-cyan via-accent-purple-light to-accent-green bg-clip-text text-transparent">
                  Steal an Egg
                </span>
              </h1>
              {isAdmin ? (
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  isSuperAdmin 
                    ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                    : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
                }`}>
                  {isSuperAdmin ? <Crown size={12} /> : <ShieldCheck size={12} />}
                  {isSuperAdmin ? 'Super Admin' : 'Admin Mode'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/30 animate-pulse">
                  ● Live Monitor
                </span>
              )}
            </div>
            <p className="text-xs font-black text-accent-yellow tracking-widest mt-0.5 m-0 uppercase font-mono">
              BY PT.KADAL GAMING
            </p>
          </div>
        </div>

        {/* Row 2: Streamer Identity (Admin: Locked Badge | Viewer: Interactive Tabs) */}
        <div>
          {isAdmin ? (
            /* ADMIN: Static Locked Badge */
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-purple/15 border border-accent-purple/30 text-xs text-white font-extrabold shadow-sm">
              <Gamepad2 size={14} className="text-accent-cyan" />
              <span className="text-text-tertiary font-medium">Streamer:</span>
              <span className="text-accent-cyan font-black">{activeWorkspace.name}</span>
            </div>
          ) : (
            /* VIEWER: Bocil-friendly Tab Pills to switch between Streamers */
            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-bg-primary border border-border-default text-xs flex-wrap">
              <span className="text-[11px] font-bold text-text-tertiary px-2 flex items-center gap-1 shrink-0">
                <Gamepad2 size={13} className="text-accent-cyan" />
                <span>Pilih Streamer:</span>
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {workspaces.map((w) => {
                  const isSelected = activeWorkspaceId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => changeWorkspace(w.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent-cyan text-bg-primary shadow-md shadow-accent-cyan/20 scale-105'
                          : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                      }`}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Bagi Link & Jam Waktu */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Share Link */}
          <button
            onClick={handleCopyShareLink}
            title="Salin link live board streamer ini untuk dibagikan ke penonton live"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-primary hover:bg-white/5 border border-border-default text-text-muted hover:text-text-primary text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {copied ? <Check size={13} className="text-accent-green" /> : <Share2 size={13} />}
            <span className="text-[11px]">{copied ? 'Tersalin!' : 'Bagi Link'}</span>
          </button>

          {/* Clock */}
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted px-3 py-1.5 rounded-xl bg-bg-primary/80 border border-border-subtle shadow-sm">
            <Clock size={12} className="text-accent-yellow" />
            <span>Jam: <strong className="text-text-primary">{currentTime || '--:--:--'}</strong></span>
          </div>
        </div>
      </div>

      {/* Right Block: Compact Items (Kelola Admin, Pengaturan, Compact Fused Mega-Control Bar) */}
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
        {isAdmin ? (
          <>
            {/* 1. Kelola Admin (Super Admin only) */}
            {isSuperAdmin && (
              <button
                onClick={onOpenManageAdminsModal}
                className="h-[44px] flex items-center gap-1.5 px-3 rounded-2xl text-xs font-extrabold text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all shadow-md shadow-accent-yellow/20 cursor-pointer"
              >
                <Crown size={14} />
                <span>Kelola Admin</span>
              </button>
            )}

            {/* 2. Pengaturan Streamer */}
            <button
              onClick={onOpenSettingsModal}
              title="Pengaturan Akun & Streamer"
              className="h-[44px] flex items-center gap-1.5 px-3 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-white/5 border border-border-default hover:border-accent-cyan/40 transition-all cursor-pointer shadow-sm"
            >
              <Settings size={14} className="text-accent-cyan" />
              <span>Pengaturan</span>
            </button>

            {/* 3. COMPACT SEAMLESS FUSED MEGA-CONTROL BAR (Snug & Compact Width) */}
            <div className="w-full sm:w-[310px] md:w-[330px] h-[44px] flex items-stretch shadow-xl shadow-black/50 overflow-hidden rounded-2xl border border-border-default bg-bg-primary shrink-0">
              
              {/* Segment 1: Order Baru (Left rounded-l-2xl, Right flat rounded-r-none, ~40% width) */}
              <button
                type="button"
                onClick={onOpenAddModal}
                className="w-[40%] h-full flex items-center justify-center gap-1 px-2.5 bg-accent-purple hover:bg-accent-purple-light active:scale-[0.98] text-white text-[11.5px] font-black transition-all cursor-pointer rounded-l-2xl rounded-r-none border-r border-black/40 shadow-inner"
              >
                <Plus size={14} />
                <span className="truncate">Order Baru</span>
              </button>

              {/* Segment 2: Stacked PAUSE ALL (Top) & RESUME ALL (Bottom) (Square, zero radius, ~20% width) */}
              <div className="w-[20%] h-full flex flex-col shrink-0 border-r border-black/40">
                {/* Pause All (Top) */}
                <button
                  type="button"
                  onClick={onRequestPauseAll}
                  title="Jeda semua billing aktif"
                  className="h-1/2 flex items-center justify-center gap-0.5 bg-accent-red/20 hover:bg-accent-red/35 active:bg-accent-red/45 text-accent-red text-[8.5px] font-black transition-all cursor-pointer rounded-none border-b border-black/40"
                >
                  <Pause size={9} />
                  <span className="truncate">PAUSE</span>
                </button>

                {/* Resume All (Bottom) */}
                <button
                  type="button"
                  onClick={onRequestResumeAll}
                  title="Lanjutkan semua billing aktif"
                  className="h-1/2 flex items-center justify-center gap-0.5 bg-accent-green/20 hover:bg-accent-green/35 active:bg-accent-green/45 text-accent-green text-[8.5px] font-black transition-all cursor-pointer rounded-none"
                >
                  <Play size={9} />
                  <span className="truncate">RESUME</span>
                </button>
              </div>

              {/* Segment 3: Streamer Mode (Left flat rounded-l-none, Right rounded-r-2xl, ~40% width) */}
              <button
                type="button"
                onClick={toggleStreamerMode}
                className={`w-[40%] h-full flex items-center justify-center gap-1 px-2 text-[11.5px] font-black transition-all cursor-pointer rounded-r-2xl rounded-l-none ${
                  streamerMode
                    ? 'bg-accent-red text-white shadow-inner animate-pulse'
                    : 'bg-bg-surface hover:bg-white/10 text-text-secondary hover:text-white'
                }`}
              >
                {streamerMode ? <VideoOff size={13} /> : <Video size={13} />}
                <span className="truncate">{streamerMode ? 'Streamer ON' : 'Streamer Mode'}</span>
              </button>
            </div>

            {/* Logout Admin */}
            <button
              onClick={handleLogout}
              title="Keluar dari mode admin"
              className="h-[44px] px-2.5 flex items-center justify-center rounded-2xl text-text-dim hover:text-text-primary hover:bg-white/5 border border-border-subtle transition-all cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          /* Public / Viewer Mode Action */
          <button
            onClick={onOpenLoginModal}
            className="h-[44px] flex items-center gap-1.5 px-4 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-white/5 border border-border-default hover:border-accent-purple/40 transition-all cursor-pointer shadow-sm"
          >
            <LogIn size={14} className="text-accent-purple" />
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default JokiHeader;
