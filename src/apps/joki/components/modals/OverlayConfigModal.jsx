import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Video, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Eye, 
  Flame, 
  Users, 
  Trophy, 
  Tv, 
  Monitor
} from 'lucide-react';
import OverlayActiveSlots from '../overlay/OverlayActiveSlots';
import OverlayQueue from '../overlay/OverlayQueue';
import OverlayLeaderboard from '../overlay/OverlayLeaderboard';
import OverlayTicker from '../overlay/OverlayTicker';
import OverlaySplitSidebar from '../overlay/OverlaySplitSidebar';

const OverlayConfigModal = ({ isOpen, onClose }) => {
  const { 
    customers, 
    queue, 
    activeWorkspace, 
    activeWorkspaceId, 
    addToast 
  } = useJoki();

  // Selected Options
  const [selectedMode, setSelectedMode] = useState('rotating');
  const [selectedTheme, setSelectedTheme] = useState('neon');
  const [selectedScale, setSelectedScale] = useState('normal');
  const [rotateSec, setRotateSec] = useState(15);
  const [previewBg, setPreviewBg] = useState('checkered'); // 'checkered' | 'dark' | 'game'
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Timer for preview
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Generate URL
  const origin = window.location.origin;
  const ws = activeWorkspaceId || 'mygameon';
  const overlayUrl = `${origin}/overlay/${ws}?mode=${selectedMode}&theme=${selectedTheme}&scale=${selectedScale}${selectedMode === 'rotating' ? `&rotateSec=${rotateSec}` : ''}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    addToast('✓ Link Overlay OBS berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPreview = () => {
    window.open(overlayUrl, '_blank');
  };

  // OBS Resolution Recommendation
  const getObsResolution = () => {
    switch (selectedMode) {
      case 'ticker':
        return { w: 1920, h: 75, desc: 'Bawah/Atas Layar Layaknya Pita Berita TV' };
      case 'split':
        return { w: 420, h: 720, desc: 'Sidebar Pojok Kanan/Kiri Layar' };
      case 'active':
        return { w: 420, h: 450, desc: 'Pojok Layar Live Gameplay' };
      case 'queue':
        return { w: 400, h: 420, desc: 'Pojok Kiri Bawah/Atas' };
      case 'leaderboard':
        return { w: 420, h: 500, desc: 'Pojok Kanan Atas' };
      case 'rotating':
      default:
        return { w: 420, h: 480, desc: 'Widget Bergantian Hemat Ruang' };
    }
  };

  const res = getObsResolution();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-4xl bg-bg-surface border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[92vh] overflow-y-auto"
        style={{ background: '#101319' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-border-subtle pb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
            <div className="w-full h-full bg-[#101319] rounded-[14px] flex items-center justify-center text-cyan-400">
              <Video size={22} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white m-0 tracking-tight">
                Live Streaming Overlay Studio
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>OBS & TikTok Live</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 m-0">
              Ekspor widget billing aktif, antrian, dan leaderboard sultan secara realtime ke software streaming Anda.
            </p>
          </div>
        </div>

        {/* Content Layout: 2 Columns (Controls Left, Live Preview Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Mode Selector */}
            <div>
              <label className="text-xs font-black text-white uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>1. Pilih Mode Tampilan Widget</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'rotating', label: 'Rotasi Otomatis', desc: 'Active ➔ Queue ➔ Sultan', icon: Sparkles, badge: 'Recommended' },
                  { id: 'split', label: 'Sidebar 3-in-1', desc: 'Active + Queue + Sultan', icon: Monitor },
                  { id: 'active', label: 'Billing Aktif Saja', desc: 'Kartu slot countdown', icon: Flame },
                  { id: 'queue', label: 'Daftar Antrian', desc: 'Nomor urut & waktu', icon: Users },
                  { id: 'leaderboard', label: 'Leaderboard Sultan', desc: 'Top Sultan terloyal', icon: Trophy },
                  { id: 'ticker', label: 'Running Ticker Bar', desc: 'Pita teks marquee TV', icon: Tv }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10' 
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      {m.badge && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded bg-cyan-500 text-black font-black text-[9px] uppercase">
                          {m.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={15} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                        <span className="font-extrabold text-xs">{m.label}</span>
                      </div>
                      <span className="text-[10.5px] text-text-dim block leading-snug">
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Theme Selector */}
            <div>
              <label className="text-xs font-black text-white uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>2. Pilih Tema Warna Visual</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'neon', name: 'Cyber Neon', color: 'from-cyan-500 to-rose-500' },
                  { id: 'gold', name: 'Sultan Gold', color: 'from-amber-500 to-yellow-300' },
                  { id: 'dark', name: 'Stealth Dark', color: 'from-slate-600 to-slate-400' },
                  { id: 'crimson', name: 'Crimson Red', color: 'from-rose-600 to-red-500' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedTheme === t.id 
                        ? 'border-white bg-white/10 text-white shadow-md' 
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-full h-3 rounded-full bg-gradient-to-r ${t.color} mb-1.5 shadow-sm`} />
                    <span className="text-[11px] font-bold block">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Extra Settings (Rotation speed / Scale) */}
            <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Skala Ukuran
                </label>
                <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                  {['compact', 'normal', 'large'].map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setSelectedScale(sc)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                        selectedScale === sc ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMode === 'rotating' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Durasi Ganti ({rotateSec}s)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={rotateSec}
                    onChange={(e) => setRotateSec(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer mt-1.5"
                  />
                </div>
              )}
            </div>

            {/* 4. Link Generator Box */}
            <div className="p-3.5 bg-bg-primary rounded-2xl border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Video size={13} />
                  <span>Link Browser Source OBS / TikTok Live</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {res.w} x {res.h} px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={overlayUrl}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono truncate select-all focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black flex items-center gap-1.5 shrink-0 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  title="Buka preview tab baru"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <ExternalLink size={15} />
                </button>
              </div>

              {/* OBS Setup Quick Guide */}
              <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-200 font-bold flex items-center gap-1">
                  <span>💡 Cara Pasang di OBS / TikTok Studio:</span>
                </div>
                <div>1. Tambahkan Source ➔ <strong>Browser Source (Peramban)</strong>.</div>
                <div>2. Paste Link di atas, isi Width: <strong>{res.w}</strong> dan Height: <strong>{res.h}</strong>.</div>
                <div>3. Centang <em>&quot;Shutdown source when not visible&quot;</em> &amp; klik OK.</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Preview Box (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} className="text-cyan-400" />
                <span>Live Preview Widget</span>
              </span>

              {/* Preview Canvas Background Switcher */}
              <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('checkered')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${previewBg === 'checkered' ? 'bg-white/20 text-white font-bold' : 'text-slate-400'}`}
                >
                  Transparan
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${previewBg === 'dark' ? 'bg-white/20 text-white font-bold' : 'text-slate-400'}`}
                >
                  Gelap
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('game')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${previewBg === 'game' ? 'bg-white/20 text-white font-bold' : 'text-slate-400'}`}
                >
                  Game
                </button>
              </div>
            </div>

            {/* Simulated Stream Screen Preview Container */}
            <div 
              className={`flex-1 min-h-[440px] max-h-[550px] rounded-2xl border border-white/15 p-3 overflow-y-auto flex flex-col justify-center items-center relative transition-colors ${
                previewBg === 'checkered'
                  ? 'bg-[#141720] bg-[radial-gradient(#2b3245_1px,transparent_1px)] [background-size:12px_12px]'
                  : previewBg === 'game'
                  ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950'
                  : 'bg-[#080a0f]'
              }`}
            >
              {/* Overlay Component in Preview */}
              <div className="w-full max-w-[380px] drop-shadow-2xl">
                {selectedMode === 'active' && (
                  <OverlayActiveSlots 
                    customers={customers} 
                    now={now} 
                    theme={selectedTheme} 
                    scale={selectedScale} 
                    title={`${activeWorkspace?.name || 'Live'} • SLOTS`}
                  />
                )}

                {selectedMode === 'queue' && (
                  <OverlayQueue 
                    queue={queue} 
                    theme={selectedTheme} 
                    scale={selectedScale} 
                    maxItems={5} 
                    title="ANTRIAN LIVE"
                  />
                )}

                {selectedMode === 'leaderboard' && (
                  <OverlayLeaderboard 
                    customers={customers} 
                    theme={selectedTheme} 
                    scale={selectedScale} 
                    maxItems={5} 
                    showPodium={true} 
                    title="TOP SULTAN"
                  />
                )}

                {selectedMode === 'ticker' && (
                  <OverlayTicker 
                    customers={customers} 
                    queue={queue} 
                    now={now} 
                    theme={selectedTheme} 
                    workspaceName={activeWorkspace?.name || 'Live Joki'}
                  />
                )}

                {selectedMode === 'split' && (
                  <OverlaySplitSidebar 
                    customers={customers} 
                    queue={queue} 
                    now={now} 
                    theme={selectedTheme} 
                    scale="compact" 
                    workspaceName={activeWorkspace?.name || 'Live'}
                  />
                )}

                {selectedMode === 'rotating' && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-cyan-400 font-mono text-center mb-1">
                      🔄 Simulasi Rotasi Mode ({rotateSec}s)
                    </div>
                    <OverlayActiveSlots 
                      customers={customers} 
                      now={now} 
                      theme={selectedTheme} 
                      scale={selectedScale} 
                      title={`${activeWorkspace?.name || 'Live'} • SLOTS`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayConfigModal;
