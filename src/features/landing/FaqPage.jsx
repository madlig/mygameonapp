import React from 'react';
import { Link } from 'react-router-dom';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDown, ArrowLeft, MessageCircle } from 'lucide-react';
import { faqItems } from './data/faq';

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829';

const FaqPage = () => {
  const waMessage = encodeURIComponent(
    'Halo admin MyGameON, saya punya pertanyaan.'
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  return (
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2A2F39] bg-[#111317]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="h-4 w-px bg-[#2A2F39]" />
          <span className="text-sm font-semibold text-[#F3F4F6]">FAQ</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Pertanyaan Umum
          </h1>
          <p className="mt-3 text-[#9CA3AF] text-lg">
            Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang
            layanan MyGameON.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <Disclosure key={index}>
              {({ open }) => (
                <div
                  className={`rounded-xl border transition-colors ${
                    open
                      ? 'border-[#FFD100]/30 bg-[#1A1F27]'
                      : 'border-[#2A2F39] bg-[#1A1F27]/60 hover:bg-[#1A1F27]'
                  }`}
                >
                  <DisclosureButton className="flex w-full items-center justify-between px-6 py-5 text-left">
                    <span className="font-semibold text-[#F3F4F6] pr-4 text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="px-6 pb-5 text-[15px] text-[#C8CFDA] leading-relaxed">
                    {item.answer}
                  </DisclosurePanel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 md:p-8 text-center">
          <p className="text-[#C8CFDA] mb-4">
            Pertanyaanmu belum terjawab? Hubungi admin langsung.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
