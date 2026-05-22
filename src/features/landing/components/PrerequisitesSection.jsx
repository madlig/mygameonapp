import React from 'react';
import { Monitor, Cpu, Settings, Archive, ExternalLink } from 'lucide-react';
import { prerequisites } from '../data/prerequisites';

const iconMap = {
  monitor: Monitor,
  cpu: Cpu,
  settings: Settings,
  archive: Archive,
};

const PrerequisitesSection = () => (
  <section id="prerequisites" className="max-w-7xl mx-auto px-6 py-10 md:py-12">
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-[#F3F4F6]">
        Software Pendukung
      </h2>
      <p className="text-[#9CA3AF] mt-2">
        Install software berikut sebelum menjalankan game untuk menghindari
        error.
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {prerequisites.map((item) => {
        const Icon = iconMap[item.icon] || Settings;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-5 hover:border-[#FFD100]/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg border border-[#2F3643] bg-[#111317] grid place-items-center">
                <Icon className="w-5 h-5 text-[#C8CFDA]" />
              </div>
              <ExternalLink className="w-4 h-4 text-[#7E8796] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h4 className="font-bold text-[#F3F4F6] text-sm">{item.name}</h4>
            <p className="mt-1 text-xs text-[#9CA3AF]">{item.description}</p>
          </a>
        );
      })}
    </div>
  </section>
);

export default PrerequisitesSection;
