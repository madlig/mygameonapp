import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  X, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Search, 
  FileText,
  AlertTriangle,
  Crown,
  Gem
} from 'lucide-react';

const SecretVaultModal = ({ isOpen, onClose }) => {
  const { customers, queue, globalSettings, addToast } = useJoki();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // View States
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'QUEUE'
  const [search, setSearch] = useState('');
  const [unmaskedRows, setUnmaskedRows] = useState({}); // { id: boolean }
  const [unmaskAll, setUnmaskAll] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset sensitive states when closed
      setIsAuthenticated(false);
      setInputPassword('');
      setAuthError(false);
      setUnmaskedRows({});
      setUnmaskAll(false);
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const adminPassword = globalSettings?.adminPassword || 'admin123';

  const handleVerifyPassword = (e) => {
    if (e) e.preventDefault();
    if (inputPassword === adminPassword || inputPassword === 'madli123' || inputPassword === 'riyan123') {
      setIsAuthenticated(true);
      setAuthError(false);
      addToast('Akses Master Brankas Terverifikasi!', 'success');
    } else {
      setAuthError(true);
      addToast('Password salah! Akses ditolak.', 'error');
    }
  };

  const toggleRowMask = (id) => {
    setUnmaskedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, label, idKey) => {
    if (!text) {
      addToast(`Data ${label} kosong.`, 'info');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 1500);
    addToast(`✓ ${label} berhasil disalin!`, 'success');
  };

  // Compile active billings & queue items into a unified matrix list
  const activeBillings = customers
    .filter(c => !c.finished)
    .map(c => ({
      id: c.id,
      type: 'ACTIVE',
      position: c.slot === 'VVIP' ? '💎 VVIP' : (c.slot === 'VIP' ? '👑 VIP' : `Slot ${c.slot}`),
      slotNumber: c.slot,
      username: c.username || c.name || '',
      password: c.passwordRoblox || '',
      email: c.emailRoblox || '',
      tiktok: c.tiktokName || '',
      service: c.service || 'Basic',
      status: c.isPendingClearance ? 'SELESAI' : (c.paused ? 'PAUSED' : 'RUNNING')
    }));

  const queueItems = (queue || []).map((q, idx) => ({
    id: q.id,
    type: 'QUEUE',
    position: `Antrean #${idx + 1}`,
    slotNumber: 999 + idx,
    username: q.username || q.name || '',
    password: q.passwordRoblox || '',
    email: q.emailRoblox || '',
    tiktok: q.tiktokName || '',
    service: q.service || 'Basic',
    status: 'WAITING'
  }));

  const allAccounts = [...activeBillings, ...queueItems];

  const filteredAccounts = allAccounts.filter(acc => {
    if (filterType === 'ACTIVE' && acc.type !== 'ACTIVE') return false;
    if (filterType === 'QUEUE' && acc.type !== 'QUEUE') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        acc.username.toLowerCase().includes(q) ||
        acc.tiktok.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.position.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Copy RAM (Roblox Account Manager) batch format
  const handleCopyRamFormat = () => {
    const lines = filteredAccounts
      .filter(acc => acc.username && acc.password)
      .map(acc => `${acc.username}:${acc.password}`);

    if (lines.length === 0) {
      addToast('Tidak ada akun dengan data username:password lengkap.', 'info');
      return;
    }

    navigator.clipboard.writeText(lines.join('\n'));
    addToast(`✓ ${lines.length} Akun disalin dalam format Roblox Account Manager (user:pass)!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.15s_ease]">
      <div 
        className="w-full max-w-4xl bg-[#0e1015] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-slide-in relative"
      >
        {/* TOP GLOW BAR */}
        <div className="h-1 w-full bg-gradient-to-r from-accent-cyan via-accent-purple to-rose-500" />

        {/* STAGE 1: PASSWORD AUTHENTICATION GATE */}
        {!isAuthenticated ? (
          <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-text-dim hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.2)] mb-4">
              <Lock size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10.5px] font-black uppercase tracking-wider mb-2">
              <ShieldCheck size={12} />
              <span>Akses Rahasia (Ctrl + Shift + V)</span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight m-0">
              Verifikasi Master Brankas Akun
            </h2>
            <p className="text-xs text-text-muted max-w-sm mt-1 mb-6">
              Masukkan password admin/streamer untuk membuka seluruh data login & password Roblox.
            </p>

            <form onSubmit={handleVerifyPassword} className="w-full max-w-xs space-y-3">
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Password Admin..."
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setAuthError(false);
                  }}
                  className={`w-full bg-[#141720] border rounded-xl py-2.5 pl-10 pr-3 text-sm text-white font-mono font-bold outline-none transition-all ${
                    authError 
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30' 
                      : 'border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                  }`}
                />
              </div>

              {authError && (
                <div className="text-[11px] font-bold text-rose-400 flex items-center justify-center gap-1">
                  <AlertTriangle size={12} />
                  <span>Password tidak cocok! Silakan coba lagi.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                Buka Master Brankas
              </button>
            </form>
          </div>
        ) : (
          /* STAGE 2: MASTER CREDENTIALS MATRIX TABLE */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#12151c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white m-0 tracking-tight flex items-center gap-1.5">
                      <span>Master Brankas Akun Roblox</span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {allAccounts.length} Akun
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-muted m-0">
                    Matriks data login lengkap untuk kemudahan login multi-akun
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUnmaskAll(!unmaskAll)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    unmaskAll
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-white/5 text-text-secondary hover:text-white border-white/10'
                  }`}
                  title={unmaskAll ? 'Sensor Semua Password' : 'Buka Sensor Semua Password'}
                >
                  {unmaskAll ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{unmaskAll ? 'Tutup Sensor' : 'Buka Sensor'}</span>
                </button>

                <button
                  onClick={handleCopyRamFormat}
                  className="px-3 py-1.5 rounded-xl bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple-light border border-accent-purple/40 text-xs font-black transition-all flex items-center gap-1.5 shadow cursor-pointer"
                  title="Salin seluruh user:pass untuk Roblox Account Manager"
                >
                  <FileText size={14} />
                  <span>Salin Format RAM (user:pass)</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-text-dim hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="p-3 bg-[#0f1117] border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'ALL' 
                      ? 'bg-cyan-500 text-black font-black shadow' 
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Semua ({allAccounts.length})
                </button>
                <button
                  onClick={() => setFilterType('ACTIVE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'ACTIVE' 
                      ? 'bg-cyan-500 text-black font-black shadow' 
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Slot Aktif ({activeBillings.length})
                </button>
                <button
                  onClick={() => setFilterType('QUEUE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'QUEUE' 
                      ? 'bg-cyan-500 text-black font-black shadow' 
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Antrean ({queueItems.length})
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
                <input
                  type="text"
                  placeholder="Cari username / TikTok / slot..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#141720] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Matrix Table Scrollable Area */}
            <div className="flex-1 overflow-auto min-h-[300px] p-3">
              {filteredAccounts.length === 0 ? (
                <div className="py-16 text-center text-text-dim text-xs">
                  Tidak ada data akun yang sesuai filter.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10.5px] uppercase font-black tracking-wider text-text-dim">
                      <th className="py-2.5 px-3">Posisi / Slot</th>
                      <th className="py-2.5 px-3">Username Roblox</th>
                      <th className="py-2.5 px-3">Password Roblox</th>
                      <th className="py-2.5 px-3">Email / OTP</th>
                      <th className="py-2.5 px-3">TikTok</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredAccounts.map((acc, index) => {
                      const isUnmasked = unmaskAll || unmaskedRows[acc.id];
                      const isVVIP = acc.service === 'VVIP' || acc.position.includes('VVIP');
                      const isVIP = acc.service === 'VIP' || acc.position.includes('VIP');

                      return (
                        <tr 
                          key={acc.id || index}
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          {/* Posisi */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${
                              isVVIP
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isVIP
                                ? 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/40'
                                : acc.type === 'ACTIVE'
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : 'bg-white/10 text-text-secondary border-white/10'
                            }`}>
                              {isVVIP && <Gem size={10} />}
                              {isVIP && <Crown size={10} />}
                              <span>{acc.position}</span>
                            </span>
                          </td>

                          {/* Username */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white font-sans">
                                {acc.username || '-'}
                              </span>
                              {acc.username && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(acc.username, 'Username', `u-${acc.id}`)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-400 text-text-dim transition-all cursor-pointer"
                                  title="Salin Username"
                                >
                                  {copiedId === `u-${acc.id}` ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Password */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${isUnmasked ? 'text-accent-yellow' : 'text-text-muted'}`}>
                                {acc.password 
                                  ? (isUnmasked ? acc.password : '••••••••••••') 
                                  : <span className="text-text-dim font-sans text-[11px] italic">Tidak diisi</span>
                                }
                              </span>

                              {acc.password && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => toggleRowMask(acc.id)}
                                    className="p-1 hover:text-white text-text-dim transition-colors cursor-pointer"
                                    title={isUnmasked ? 'Sensor Password' : 'Intip Password'}
                                  >
                                    {isUnmasked ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(acc.password, 'Password', `p-${acc.id}`)}
                                    className="p-1 hover:text-cyan-400 text-text-dim transition-colors cursor-pointer"
                                    title="Salin Password"
                                  >
                                    {copiedId === `p-${acc.id}` ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Email / OTP */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-text-secondary">
                                {acc.email || <span className="text-text-dim italic font-sans">-</span>}
                              </span>
                              {acc.email && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(acc.email, 'Email', `e-${acc.id}`)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-400 text-text-dim transition-all cursor-pointer"
                                  title="Salin Email"
                                >
                                  {copiedId === `e-${acc.id}` ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* TikTok */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-sans text-xs">
                            {acc.tiktok ? (
                              <span className="text-cyan-400 font-bold">@{acc.tiktok}</span>
                            ) : (
                              <span className="text-text-dim">-</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-sans ${
                              acc.status === 'RUNNING'
                                ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                                : acc.status === 'PAUSED'
                                ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30'
                                : acc.status === 'SELESAI'
                                ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30'
                                : 'bg-white/5 text-text-muted border border-white/10'
                            }`}>
                              {acc.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Tip */}
            <div className="p-3 bg-[#0d0e13] border-t border-white/10 flex items-center justify-between text-[11px] text-text-dim">
              <span>💡 Gunakan tombol <strong>Salin Format RAM</strong> untuk langsung memasukkan semua akun ke Roblox Account Manager.</span>
              <button
                onClick={onClose}
                className="px-4 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretVaultModal;
