import React from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqItems } from '../data/faq';

const FaqSection = () => (
  <section id="faq" className="max-w-5xl mx-auto px-4 sm:px-8 py-14 scroll-mt-20">
    <div className="text-center max-w-2xl mx-auto mb-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
        <HelpCircle size={13} className="text-amber-400" />
        <span>Bantuan & Panduan</span>
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2 font-display">
        Pertanyaan yang Sering Ditanya
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
        Jawaban jelas dan transparan untuk pertanyaan yang paling sering diajukan pembeli.
      </p>
    </div>
    <div className="max-w-3xl mx-auto space-y-3">
      {faqItems.map((item, index) => (
        <Disclosure key={index} defaultOpen={index === 0}>
          {({ open }) => (
            <div
              className={`rounded-2xl border transition-all duration-200 shadow-md ${
                open
                  ? 'border-amber-400/50 bg-[#0E1320] shadow-amber-400/5'
                  : 'border-white/10 bg-[#090D15] hover:border-white/20'
              }`}
            >
              <DisclosureButton className="flex w-full items-center justify-between px-5 py-4 text-left group">
                <span className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    open ? 'rotate-180 text-amber-400' : 'group-hover:text-white'
                  }`}
                />
              </DisclosureButton>
              <DisclosurePanel className="px-5 pb-4 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                {item.answer}
              </DisclosurePanel>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  </section>
);

export default FaqSection;
