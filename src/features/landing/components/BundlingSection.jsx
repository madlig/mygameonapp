import React from 'react';
import { Layers, Check, ArrowRight, Gift, QrCode } from 'lucide-react';
import { buildWhatsAppUrl } from '../../../config/integrations';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { useCart } from '../../../contexts/CartContext';

const BUNDLING_TIERS = [
  {
    id: 'b5',
    name: 'Paket Beli 5',
    games: '5 Game PC',
    bonusCount: 2,
    totalCount: 7,
    bonusText: '+ BONUS 2 Game',
    totalGames: 'Dapat Total 7 Game',
    price: 'Rp 50.000',
    unitPrice: 'Cuma ~Rp 7.100 / game',
    features: [
      'Download langsung dari Google Drive',
      'Video tutorial cara download & ekstrak',
      'Dipandu admin jika ada kesulitan',
    ],
    isPopular: false,
    ctaText: 'Pilih Beli 5 (Dapat 7)',
  },
  {
    id: 'b10',
    name: 'Paket Beli 10',
    games: '10 Game PC',
    bonusCount: 3,
    totalCount: 13,
    bonusText: '+ BONUS 3 Game',
    totalGames: 'Dapat Total 13 Game',
    price: 'Rp 80.000',
    unitPrice: 'Cuma ~Rp 6.100 / game',
    features: [
      'Download langsung dari Google Drive',
      'Video tutorial cara download & ekstrak',
      'Dipandu admin jika ada kesulitan',
    ],
    isPopular: true,
    ctaText: 'Pilih Beli 10 (Dapat 13)',
  },
  {
    id: 'b15',
    name: 'Paket Beli 15',
    games: '15 Game PC',
    bonusCount: 4,
    totalCount: 19,
    bonusText: '+ BONUS 4 Game',
    totalGames: 'Dapat Total 19 Game',
    price: 'Rp 110.000',
    unitPrice: 'Cuma ~Rp 5.700 / game',
    features: [
      'Download langsung dari Google Drive',
      'Video tutorial cara download & ekstrak',
      'Dipandu admin jika ada kesulitan',
    ],
    isPopular: false,
    ctaText: 'Pilih Beli 15 (Dapat 19)',
  },
  {
    id: 'b20',
    name: 'Paket Beli 20',
    games: '20 Game PC',
    bonusCount: 5,
    totalCount: 25,
    bonusText: '+ BONUS 5 Game',
    totalGames: 'Dapat Total 25 Game',
    price: 'Rp 140.000',
    unitPrice: 'Cuma ~Rp 5.600 / game',
    features: [
      'Download langsung dari Google Drive',
      'Video tutorial cara download & ekstrak',
      'Dipandu admin jika ada kesulitan',
    ],
    isPopular: false,
    ctaText: 'Pilih Beli 20 (Dapat 25)',
  },
];

const BundlingSection = () => {
  const { addToCart } = useCart();
  return (
    <section id="bundling" className="px-4 sm:px-8 py-12 sm:py-16 bg-[#090C12] border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Layers size={14} />
            <span>Paket Koleksi Game Borongan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 font-display">
            Paket Bundling Game PC Murah
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Mau download banyak game sekaligus? Pilih paket bundling di bawah. Bebas pilih judul apa saja di katalog kami dengan harga jauh lebih murah!
          </p>
        </div>

        {/* 4 Tier Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {BUNDLING_TIERS.map((tier) => {
            const totalCount = tier.id === 'b5' ? 7 : tier.id === 'b10' ? 13 : tier.id === 'b15' ? 19 : 25;
            const sampleLines = Array.from({ length: totalCount }, (_, i) => `${i + 1}. [Judul Game ${i + 1}]`).join('\n');
            const waUrl = buildWhatsAppUrl({
              text: `Halo Admin MyGameON, saya mau order ${tier.name} (${tier.totalGames} seharga ${tier.price}):\n\nDaftar Game Pilihan Saya:\n${sampleLines}\n\nEmail Google Drive: [Tulis email Gmail kamu di sini]\nMohon info nomor rekening dan totalnya ya min!`,
            });

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  tier.isPopular
                    ? 'bg-[#0E121C] border-2 border-amber-400/80 shadow-xl shadow-amber-400/10 -translate-y-1'
                    : 'bg-[#0B0E14] border border-white/10 hover:border-white/20'
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                    Pilihan Terpopuler
                  </div>
                )}

                <div>
                  {/* Tier Name */}
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {tier.name}
                  </div>

                  {/* Main Games Title */}
                  <div className="text-2xl font-black text-white tracking-tight">
                    {tier.games}
                  </div>

                  {/* Aesthetic Bonus Tag */}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-extrabold shadow-sm shadow-emerald-500/5">
                      <Gift size={13} className="text-emerald-400 shrink-0" />
                      <span>+ Bonus {tier.bonusCount} Game</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {tier.price}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {tier.unitPrice}
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-white/5 pt-4 text-xs text-slate-300">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart({
                        id: tier.id,
                        title: `${tier.name} (Dapat ${tier.totalCount} Game Bebas Pilih)`,
                        price: tier.price,
                        coverImageUrl: '/branding/AMON_Shopee_Avatar_Circular_TransparentCorner.png',
                        type: 'bundling',
                      });
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 ${
                      tier.isPopular
                        ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                    }`}
                  >
                    <QrCode size={15} />
                    <span>Checkout QRIS Langsung</span>
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-400 shrink-0" />
                    <span>atau pesan manual via WA</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default BundlingSection;
