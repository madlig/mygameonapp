import React from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { faqItems } from '../data/faq';

const FaqSection = () => (
  <section id="faq" className="max-w-7xl mx-auto px-6 py-10 md:py-12">
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-[#F3F4F6]">
        Pertanyaan Umum (FAQ)
      </h2>
      <p className="text-[#9CA3AF] mt-2">
        Jawaban untuk pertanyaan yang sering ditanyakan.
      </p>
    </div>
    <div className="max-w-3xl mx-auto space-y-3">
      {faqItems.map((item, index) => (
        <Disclosure key={index}>
          {({ open }) => (
            <div
              className={`rounded-xl border ${open ? 'border-[#FFD100]/30 bg-[#1A1F27]' : 'border-[#2A2F39] bg-[#1A1F27]'} transition-colors`}
            >
              <DisclosureButton className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="font-semibold text-[#F3F4F6] pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </DisclosureButton>
              <DisclosurePanel className="px-5 pb-4 text-sm text-[#C8CFDA] leading-relaxed">
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
