import React from 'react';
import { Gamepad2, Laptop, Search, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../../../config/integrations';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';

const SERVICES = [
  {
    id: 'joki',
    icon: Gamepad2,
    badge: 'Populer',
    badgeColor: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
    title: 'Jasa Joki & Setting Game',
    description: 'Bantu pasang Mod, CC, & seluruh DLC The Sims 4, atau setting visual optimal game PC tertentu agar bebas error dan langsung siap main.',
    waText: 'Halo Admin MyGameON, saya tertarik dengan Jasa Joki / Setting Mod & DLC. Mau tanya prosedur dan biayanya min?',
  },
  {
    id: 'install',
    icon: Laptop,
    badge: 'Hemat Waktu',
    badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    title: 'Install Windows & Paket Game',
    description: 'Laptop baru atau baru diformat yang belum siap main? Kami bantu install driver, DirectX, dan paket game pilihan sampai tuntas.',
    waText: 'Halo Admin MyGameON, saya mau tanya layanan Install Windows & Paket Game PC siap main.',
  },
  {
    id: 'konsultasi',
    icon: Search,
    badge: 'Bebas Tanya Sepuasnya',
    badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    title: 'Konsultasi Spek & Device',
    description: 'Mau beli laptop baru atau upgrade PC tapi bingung apakah kuat memainkan game favoritmu? Chat admin kami gratis tanpa syarat!',
    waText: 'Halo Admin MyGameON, saya mau konsultasi spek laptop/PC sebelum beli game. Mau tanya rekomendasi game yang cocok min.',
  },
];

const AdditionalServicesSection = () => {
  return (
    <section id="layanan" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
          <Sparkles size={13} className="text-amber-400" />
          <span>Ekosistem Layanan Lengkap</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2 font-display">
          Layanan Tambahan
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Solusi ekstra untuk Anda yang ingin terima beres tanpa perlu repot setting sendiri.
        </p>
      </div>

      {/* 3 Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SERVICES.map((srv) => {
          const Icon = srv.icon;
          const waUrl = buildWhatsAppUrl({ text: srv.waText });

          return (
            <div
              key={srv.id}
              className="p-6 rounded-3xl bg-[#090D15] border border-white/10 hover:border-amber-400/40 transition-all duration-200 flex flex-col justify-between shadow-xl group relative overflow-hidden"
            >
              {/* Subtle Corner Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Header: Icon & Badge */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:border-amber-400/40 group-hover:bg-amber-400/10 transition-colors">
                    <Icon size={22} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${srv.badgeColor}`}>
                    {srv.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-extrabold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {srv.description}
                </p>
              </div>

              {/* Action Button: WhatsApp */}
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/10 active:scale-95"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                <span>Hubungi Kami via WA</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AdditionalServicesSection;
