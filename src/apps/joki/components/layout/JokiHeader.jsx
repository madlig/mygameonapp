import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Plus, 
  Pause, 
  Play, 
  Video, 
  VideoOff, 
  Trash2, 
  LogIn, 
  LogOut, 
  Clock, 
  ShieldCheck,
  Radio,
  Share2,
  Check,
  Crown
} from 'lucide-react';

const JokiHeader = ({ 
  onOpenAddModal, 
  onOpenLoginModal,
  onOpenManageAdminsModal,
  onRequestPauseAll, 
  onRequestResumeAll, 
  onRequestClearTransactions
}) => {
  const { 
    isAdmin, 
    isSuperAdmin,
    currentUser,
    logout,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    changeWorkspace,
    globalPaused, 
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
    <header className="bg-bg-surface/80 backdrop-blur-xl border border-border-default rounded-2xl p-5 md:p-6 mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 shadow-2xl transition-all">
      {/* Brand, Channel Badge & Live Clock */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-yellow/10 border border-accent-purple/30 flex items-center justify-center text-lg shadow-inner">
            🥚
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-text-primary tracking-tight m-0">
                Steal an Egg <span className="text-accent-purple">—</span> Joki Billing
              </h1>
              {isAdmin ? (
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isSuperAdmin 
                    ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                    : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
                }`}>
                  {isSuperAdmin ? <Crown size={12} /> : <ShieldCheck size={12} />}
                  {isSuperAdmin ? 'Super Admin' : 'Admin Mode'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/30 animate-pulse">
                  ● Live Monitor
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 m-0 font-medium">
              Dashboard Realtime Monitoring Jasa Joki Roblox AFK
            </p>
          </div>
        </div>

        {/* Channel Selector & Live Clock Bar */}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {/* Workspace / Channel Switcher */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-primary border border-border-default text-xs">
            <Radio size={13} className="text-accent-cyan animate-pulse" />
            <span className="text-text-dim text-[11px] font-semibold">Kanal:</span>
            <select
              value={activeWorkspaceId}
              onChange={(e) => changeWorkspace(e.target.value)}
              className="bg-transparent text-text-primary font-bold text-xs outline-none cursor-pointer pr-1"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-bg-surface text-text-primary">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyShareLink}
            title="Salin link live board kanal ini untuk dibagikan ke penonton live"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-primary hover:bg-white/5 border border-border-default text-text-muted hover:text-text-primary text-xs font-semibold transition-all cursor-pointer"
          >
            {copied ? <Check size={12} className="text-accent-green" /> : <Share2 size={12} />}
            <span className="text-[11px]">{copied ? 'Tersalin!' : 'Bagi Link'}</span>
          </button>

          {/* Clock */}
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted px-2.5 py-1 rounded-lg bg-bg-primary/80 border border-border-subtle">
            <Clock size={12} className="text-accent-yellow" />
            <span>Jam: <strong className="text-text-primary">{currentTime || '--:--:--'}</strong></span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
        {isAdmin ? (
          <>
            {/* Super Admin Manage Admins Button */}
            {isSuperAdmin && (
              <button
                onClick={onOpenManageAdminsModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all shadow-lg shadow-accent-yellow/20 cursor-pointer"
              >
                <Crown size={14} />
                <span>Kelola Admin</span>
              </button>
            )}

            {/* Primary Action */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-lg shadow-accent-purple/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Tambah Joki</span>
            </button>

            {/* Bulk Pause / Resume */}
            <button
              onClick={onRequestPauseAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-accent-red bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 active:scale-95 transition-all cursor-pointer"
            >
              <Pause size={14} />
              <span>PAUSE ALL</span>
            </button>

            <button
              onClick={onRequestResumeAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-accent-green bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play size={14} />
              <span>RESUME ALL</span>
            </button>

            {/* Streamer Mode Toggle */}
            <button
              onClick={toggleStreamerMode}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                streamerMode
                  ? 'bg-accent-red text-white border-accent-red shadow-lg shadow-accent-red/20 animate-pulse'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary border-border-default hover:border-border-muted'
              }`}
            >
              {streamerMode ? <VideoOff size={14} /> : <Video size={14} />}
              <span>{streamerMode ? 'Streamer ON' : 'Streamer Mode'}</span>
            </button>

            {/* Clear Transactions (Hidden in Streamer Mode) */}
            {!streamerMode && (
              <button
                onClick={onRequestClearTransactions}
                title="Hapus seluruh data transaksi di kanal ini"
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            )}

            {/* Logout Admin */}
            <button
              onClick={handleLogout}
              title="Keluar dari mode admin"
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-text-dim hover:text-text-primary hover:bg-white/5 border border-border-subtle transition-all cursor-pointer ml-1"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          /* Public / Viewer Mode Action */
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-white/5 border border-border-default hover:border-accent-purple/40 transition-all cursor-pointer"
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
