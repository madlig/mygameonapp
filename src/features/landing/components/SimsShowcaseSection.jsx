import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Disc, Layers, CheckCircle2, Play, RefreshCw, KeyRound, Heart } from 'lucide-react';

const SIMS_FEATURES = [
  {
    icon: Layers,
    title: 'Semua 70+ Packs Lengkap',
    desc: 'Expansion Pack, Game Pack, Stuff Pack, hingga Kits terbaru sudah terbuka otomatis.',
  },
  {
    icon: RefreshCw,
    title: 'Auto Update 1-Klik',
    desc: 'Update patch game terbaru langsung dari launcher tanpa perlu download ulang dari awal.',
  },
  {
    icon: Heart,
    title: 'Bebas Pasang Mod & CC',
    desc: 'Bebas pasang baju, rambut, kosmetik, dan script mod buatan kreator favoritmu.',
  },
  {
    icon: Play,
    title: 'Tinggal Klik & Main',
    desc: 'Instalasi praktis tanpa ribet ekstrak part file manual atau setting yang membingungkan.',
  },
];

const SimsShowcaseSection = () => {
  return (
    <section id="sims-launcher" className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-[#0F1422] via-[#090C14] to-[#06070B] border border-white/10 rounded-3xl p-6 sm:p-12 relative overflow-hidden shadow-2xl">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Information & Features */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold uppercase tracking-wider mb-4">
              <Disc size={14} />
              <span>Spesial Pemain The Sims 4</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4 font-display">
              The Sims 4 All Packs Launcher <span className="text-amber-400">v10</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Mainkan The Sims 4 dengan seluruh DLC resmi terlengkap. Cukup buka launcher, klik main, dan nikmati petualangan sim Anda tanpa ribet!
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {SIMS_FEATURES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-2xl p-3.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/downloads"
                className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-400/10"
              >
                <Download size={16} />
                <span>Download Launcher Gratis</span>
              </Link>
              <Link
                to="/claim"
                className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 border border-white/10 transition-all"
              >
                <KeyRound size={15} className="text-emerald-400" />
                <span>Klaim Lisensi Shopee</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Card Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-[#0C101A] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">Semua Packs Siap Main</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Launcher v10.0.13
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5 text-slate-300">
                  <span className="text-slate-400">Expansion Packs:</span>
                  <span className="text-white font-bold">16 Packs Lengkap</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5 text-slate-300">
                  <span className="text-slate-400">Game & Stuff Packs:</span>
                  <span className="text-white font-bold">30+ Packs Lengkap</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5 text-slate-300">
                  <span className="text-slate-400">Kits Collection:</span>
                  <span className="text-white font-bold">30+ Kits Terbaru</span>
                </div>
                <div className="flex justify-between py-2 text-slate-300">
                  <span className="text-slate-400">Aktivasi Shopee:</span>
                  <span className="text-emerald-400 font-bold">1-Klik Pakai No. Pesanan</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sudah beli di Shopee? Cukup masukkan Nomor Pesanan Shopee Anda ke dalam launcher untuk langsung membuka semua DLC.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SimsShowcaseSection;
