import React from 'react';
import { MessageCircle, Headset } from 'lucide-react';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

const WhatsAppContactSection = () => {
  const waMessage = encodeURIComponent(
    'Halo admin MyGameON, saya butuh bantuan.'
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  return (
    <section id="contact" className="max-w-7xl mx-auto px-6 py-10 md:py-12">
      <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-md border border-green-500/35 bg-green-500/10 grid place-items-center">
              <Headset className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#F3F4F6]">
              Butuh Bantuan?
            </h2>
          </div>
          <p className="text-[#C8CFDA]">
            Hubungi admin via WhatsApp untuk bantuan install, troubleshooting,
            atau layanan remote install via AnyDesk/TeamViewer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-[#2F3643] bg-[#111317] px-2.5 py-1 text-[#C8CFDA]">
              Remote Install
            </span>
            <span className="rounded-md border border-[#2F3643] bg-[#111317] px-2.5 py-1 text-[#C8CFDA]">
              Troubleshooting
            </span>
            <span className="rounded-md border border-[#2F3643] bg-[#111317] px-2.5 py-1 text-[#C8CFDA]">
              Konsultasi Game
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppContactSection;
