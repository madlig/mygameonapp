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
    <header className="bg-bg-surface/80 backdrop-blur-xl border border-border-default rounded-3xl p-5 md:p-6 mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shadow-2xl transition-all">
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

      {/* Right Block: Controls Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
        {isAdmin ? (
          <>
            {/* Top Admin Tools: Super Admin & Settings */}
            <div className="flex items-center gap-1.5">
              {isSuperAdmin && (
                <button
                  onClick={onOpenManageAdminsModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all shadow-md shadow-accent-yellow/20 cursor-pointer"
                >
                  <Crown size={14} />
                  <span>Kelola Admin</span>
                </button>
              )}

              <button
                onClick={onOpenSettingsModal}
                title="Pengaturan Akun & Streamer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-white/5 border border-border-default hover:border-accent-cyan/40 transition-all cursor-pointer shadow-sm"
              >
                <Settings size={14} className="text-accent-cyan" />
                <span>Pengaturan</span>
              </button>
            </div>

            {/* BUNDLED OPERATIONAL ACTIONS CONTAINER */}
            <div className="p-1.5 rounded-2xl bg-bg-primary/95 border border-border-default flex items-center gap-1.5 shadow-inner flex-wrap">
              
              {/* 1. Primary Action: Tambah Joki (Wide Proportion) */}
              <button
                onClick={onOpenAddModal}
                className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-md shadow-accent-purple/25 cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>Tambah Joki</span>
              </button>

              {/* 2. Compact Bulk Actions: PAUSE ALL & RESUME ALL */}
              <div className="flex items-center gap-1 px-1 border-x border-border-subtle">
                <button
                  onClick={onRequestPauseAll}
                  title="Jeda semua billing yang sedang berjalan"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-accent-red bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Pause size={12} />
                  <span>PAUSE ALL</span>
                </button>

                <button
                  onClick={onRequestResumeAll}
                  title="Lanjutkan semua billing yang sedang dijeda"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-accent-green bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={12} />
                  <span>RESUME ALL</span>
                </button>
              </div>

              {/* 3. Streamer Mode Toggle (Wide Proportion) */}
              <button
                onClick={toggleStreamerMode}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shrink-0 ${
                  streamerMode
                    ? 'bg-accent-red text-white border-accent-red shadow-md shadow-accent-red/20 animate-pulse'
                    : 'bg-bg-surface text-text-secondary hover:text-white border-border-default hover:border-border-muted shadow-sm'
                }`}
              >
                {streamerMode ? <VideoOff size={14} /> : <Video size={14} />}
                <span>{streamerMode ? 'Streamer ON' : 'Streamer Mode'}</span>
              </button>
            </div>

            {/* Logout Admin */}
            <button
              onClick={handleLogout}
              title="Keluar dari mode admin"
              className="p-2 rounded-xl text-text-dim hover:text-text-primary hover:bg-white/5 border border-border-subtle transition-all cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          /* Public / Viewer Mode Action */
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-white/5 border border-border-default hover:border-accent-purple/40 transition-all cursor-pointer shadow-sm"
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
