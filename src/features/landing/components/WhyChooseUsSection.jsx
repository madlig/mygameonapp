import React from 'react';
import { ShieldCheck, Headphones, Tag, Users, CheckCircle2 } from 'lucide-react';

const TRUST_PILLARS = [
  {
    id: 'garansi',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    title: 'Garansi 100% Jalan',
    description: 'Game tidak bisa jalan di laptopmu? Uang kembali atau dibantu setting remote sampai game berhasil dimainkan.',
  },
  {
    id: 'bantuan',
    icon: Headphones,
    iconBg: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
    title: 'Bantuan Instalasi Gratis',
    description: 'Bebas tanya sepuasnya! Admin ramah siap membimbing langkah demi langkah via WhatsApp sampai game siap dimainkan.',
  },
  {
    id: 'harga',
    icon: Tag,
    iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    title: 'Harga Transparan',
    description: 'Satu kali bayar untuk selamanya. Tanpa biaya langganan bulanan dan link Google Drive direct download full speed.',
  },
  {
    id: 'reputasi',
    icon: Users,
    iconBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    title: '5.000+ Pembeli Puas',
    description: 'Telah melayani dan dipercaya ribuan gamer di seluruh Indonesia sejak 2021 dengan reputasi toko bintang 5.',
  },
];

const WhyChooseUsSection = () => {
  return (
    <section id="tentang" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>Kenyamanan & Kepercayaan</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2 font-display">
          Kenapa Pilih MyGame<span className="text-amber-400">ON</span>?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Kami mengutamakan kemudahan dan kepuasan pembeli dari persiapan sampai game siap dimainkan tanpa drama.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {TRUST_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.id}
              className="p-5 sm:p-6 rounded-2xl bg-[#090D15] border border-white/10 hover:border-amber-400/40 transition-all duration-200 group flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${pillar.iconBg}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
