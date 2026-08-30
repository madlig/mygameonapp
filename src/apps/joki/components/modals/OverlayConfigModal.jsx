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
  Monitor,
  LayoutGrid,
  Maximize2
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
  const [selectedMode, setSelectedMode] = useState('active');
  const [selectedLayout, setSelectedLayout] = useState('grid');
  const [selectedCols, setSelectedCols] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('gold');
  const [selectedScale, setSelectedScale] = useState('xl');
  const [showEmpty, setShowEmpty] = useState(true);
  const [totalSlots, setTotalSlots] = useState(6);
  const [rotateSec, setRotateSec] = useState(15);
  const [previewBg, setPreviewBg] = useState('game'); // 'checkered' | 'dark' | 'game'
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
  const overlayUrl = `${origin}/overlay/${ws}?mode=${selectedMode}&theme=${selectedTheme}&scale=${selectedScale}&layout=${selectedLayout}&cols=${selectedCols}&showEmpty=${showEmpty}&totalSlots=${totalSlots}${selectedMode === 'rotating' ? `&rotateSec=${rotateSec}` : ''}`;

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
    if (selectedMode === 'ticker') {
      return { w: 1920, h: 75, desc: 'Pita Teks Berjalan Bawah Layar' };
    }
    if (selectedMode === 'split') {
      return { w: 420, h: 720, desc: 'Sidebar Pojok Kanan/Kiri' };
    }
    if (selectedLayout === 'grid') {
      if (selectedCols === 3) {
        return { w: 1080, h: 280, desc: 'Grid 3 Kolom Bawah Gameplay 6 Layar' };
      }
      if (selectedCols === 2) {
        return { w: 800, h: 360, desc: 'Grid 2 Kolom' };
      }
      return { w: 1920, h: 320, desc: 'Full Width 6 Kolom' };
    }
    return { w: 420, h: 500, desc: 'Sidebar Vertikal Single Column' };
  };

  const res = getObsResolution();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-5xl bg-bg-surface border border-border-default rounded-3xl p-5 md:p-6 shadow-2xl animate-slide-in relative max-h-[94vh] overflow-y-auto"
        style={{ background: '#0e1118' }}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white m-0 tracking-tight">
                Live Streaming Overlay Studio
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>TikTok Live & OBS</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 m-0">
              Tampilan siaran live broadcast resolusi tinggi dengan tipografi tajam dan tata letak multi-kolom.
            </p>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Controls (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. Mode Selector */}
            <div>
              <label className="text-xs font-black text-white uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>1. Mode Widget</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'active', label: 'Billing Aktif', desc: 'Kartu slot countdown', icon: Flame, badge: 'Popular' },
                  { id: 'rotating', label: 'Rotasi Auto', desc: 'Active ➔ Antrian ➔ Sultan', icon: Sparkles },
                  { id: 'queue', label: 'Antrian Saja', desc: 'Daftar tunggu live', icon: Users },
                  { id: 'leaderboard', label: 'Top Sultan', desc: 'Podium Sultan Terloyal', icon: Trophy },
                  { id: 'split', label: 'Sidebar 3-in-1', desc: 'Vertical complete bar', icon: Monitor },
                  { id: 'ticker', label: 'Running Ticker', desc: 'Pita teks marquee TV', icon: Tv }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50' 
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      {m.badge && (
                        <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-cyan-400 text-black font-black text-[8.5px] uppercase">
                          {m.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                        <span className="font-extrabold text-xs">{m.label}</span>
                      </div>
                      <span className="text-[10px] text-text-dim block leading-tight truncate">
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Layout & Columns Selector */}
            {(selectedMode === 'active' || selectedMode === 'rotating') && (
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2.5">
                <label className="text-xs font-black text-white uppercase tracking-wider block flex items-center gap-1.5">
                  <LayoutGrid size={13} className="text-purple-400" />
                  <span>2. Tata Letak (Layout)</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedLayout('grid'); setSelectedCols(3); }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedLayout === 'grid' && selectedCols === 3
                        ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-black">Grid 3 Kolom</span>
                    <span className="text-[9.5px] text-slate-400">Cocok bawah 6 layar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedLayout('grid'); setSelectedCols(2); }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedLayout === 'grid' && selectedCols === 2
                        ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-black">Grid 2 Kolom</span>
                    <span className="text-[9.5px] text-slate-400">Medium width</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLayout('list')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedLayout === 'list'
                        ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-black">Sidebar (1 Kolom)</span>
                    <span className="text-[9.5px] text-slate-400">Vertikal samping</span>
                  </button>
                </div>

                {/* Show Empty Slots Toggle & Total Slots */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-300">
                    Tampilkan Kartu Slot Kosong:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmpty(!showEmpty)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      showEmpty ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {showEmpty ? '✓ AKTIF' : 'SEMBUNYIKAN'}
                  </button>
                </div>

                {showEmpty && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[11px] font-bold text-slate-300">
                      Jumlah Slot Buka:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[3, 4, 6, 8].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTotalSlots(num)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-black cursor-pointer ${
                            totalSlots === num ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMode === 'rotating' && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[11px] font-bold text-slate-300">
                      Durasi Ganti Otomatis:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[10, 15, 20, 30].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setRotateSec(sec)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-black cursor-pointer ${
                            rotateSec === sec ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Theme & Scale Selector */}
            <div className="grid grid-cols-2 gap-3">
              {/* Theme */}
              <div>
                <label className="text-xs font-black text-white uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>Warna Tema</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'gold', name: 'Sultan Gold', color: 'from-amber-500 to-yellow-300' },
                    { id: 'neon', name: 'Cyan Neon', color: 'from-cyan-500 to-purple-500' },
                    { id: 'crimson', name: 'Crimson Red', color: 'from-rose-600 to-red-500' },
                    { id: 'dark', name: 'Stealth Dark', color: 'from-slate-600 to-slate-400' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedTheme === t.id 
                          ? 'border-white bg-white/15 text-white shadow-md font-black' 
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-full h-2 rounded-full bg-gradient-to-r ${t.color} mb-1`} />
                      <span className="text-[10.5px] block truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="text-xs font-black text-white uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Maximize2 size={12} className="text-cyan-400" />
                  <span>Ukuran Font & Resolusi</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'normal', name: 'Normal (100%)' },
                    { id: 'large', name: 'Besar (125%)' },
                    { id: 'xl', name: 'Ekstra (150%)', badge: 'Best' },
                    { id: '2xl', name: 'Jumbo (200%)' }
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSelectedScale(sc.id)}
                      className={`p-2 rounded-xl border text-center transition-all relative cursor-pointer ${
                        selectedScale === sc.id 
                          ? 'border-cyan-400 bg-cyan-500/20 text-white font-black' 
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                      }`}
                    >
                      {sc.badge && (
                        <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-cyan-400 text-black text-[8px] font-black">
                          {sc.badge}
                        </span>
                      )}
                      <span className="text-[10.5px] block truncate font-bold">{sc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Link Generator Box */}
            <div className="p-3.5 bg-bg-primary rounded-2xl border border-cyan-500/40 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Video size={13} />
                  <span>Link Browser Source TikTok Live Studio / OBS</span>
                </span>
                <span className="text-[11px] text-amber-300 font-mono font-black bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {res.w} x {res.h} px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={overlayUrl}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono truncate select-all focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-black flex items-center gap-1.5 shrink-0 transition-all shadow-lg shadow-cyan-400/25 cursor-pointer"
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
              <div className="bg-white/[0.03] rounded-xl p-2.5 border border-white/5 text-[11px] text-slate-300 space-y-1">
                <div className="text-white font-bold flex items-center gap-1">
                  <span>💡 Cara Pasang di TikTok Live Studio:</span>
                </div>
                <div>1. Klik <strong>+ Add Source</strong> ➔ pilih <strong>Link</strong> (Tautan).</div>
                <div>2. Paste Link di atas, masukkan Width: <strong>{res.w}</strong> dan Height: <strong>{res.h}</strong>.</div>
                <div>3. Atur posisi widget tepat di area bawah 6 gameplay Roblox Anda.</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Preview Box (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} className="text-cyan-400" />
                <span>Live Preview Sesuai Pengaturan</span>
              </span>

              {/* Preview Canvas Background Switcher */}
              <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('game')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${previewBg === 'game' ? 'bg-cyan-500 text-black font-black' : 'text-slate-400'}`}
                >
                  Simulasi Stream
                </button>
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
              </div>
            </div>

            {/* Simulated Stream Screen Preview Container */}
            <div 
              className={`flex-1 min-h-[440px] max-h-[560px] rounded-2xl border border-white/15 p-3 overflow-y-auto flex flex-col justify-start items-center relative transition-colors ${
                previewBg === 'checkered'
                  ? 'bg-[#141720] bg-[radial-gradient(#2b3245_1px,transparent_1px)] [background-size:12px_12px]'
                  : previewBg === 'game'
                  ? 'bg-gradient-to-b from-[#111624] via-[#090d16] to-[#04060a]'
                  : 'bg-[#080a0f]'
              }`}
            >
              {/* Overlay Component in Preview */}
              <div className="w-full drop-shadow-2xl">
                {selectedMode === 'active' && (
                  <OverlayActiveSlots 
                    customers={customers} 
                    now={now} 
                    theme={selectedTheme} 
                    scale={selectedScale} 
                    layout={selectedLayout}
                    cols={selectedCols}
                    totalSlots={totalSlots}
                    showEmpty={showEmpty}
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
                  <div className="space-y-2 w-full">
                    <div className="text-[10px] text-cyan-400 font-mono text-center mb-1 bg-cyan-500/10 py-1 rounded-lg border border-cyan-500/20">
                      🔄 Simulasi Rotasi Otomatis ({rotateSec}s)
                    </div>
                    <OverlayActiveSlots 
                      customers={customers} 
                      now={now} 
                      theme={selectedTheme} 
                      scale={selectedScale} 
                      layout={selectedLayout}
                      cols={selectedCols}
                      totalSlots={totalSlots}
                      showEmpty={showEmpty}
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
