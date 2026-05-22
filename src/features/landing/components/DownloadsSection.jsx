import React from 'react';
import { Gamepad2, Download, ArrowDownToLine, Clock } from 'lucide-react';
import { downloads } from '../data/downloads';

const iconMap = {
  'gamepad-2': Gamepad2,
  download: Download,
};

const DownloadCard = ({ app }) => {
  const Icon = iconMap[app.icon] || Download;

  if (!app.isAvailable) {
    return (
      <div className="relative rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 opacity-70">
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-md bg-[#FFD100]/15 px-2.5 py-1 text-xs font-semibold text-[#FFD100]">
          <Clock className="w-3 h-3" />
          {app.comingSoonNote}
        </span>
        <div className="w-12 h-12 rounded-lg border border-[#2F3643] bg-[#111317] grid place-items-center mb-4">
          <Icon className="w-6 h-6 text-[#9CA3AF]" />
        </div>
        <h3 className="text-lg font-bold text-[#9CA3AF]">{app.name}</h3>
        <p className="mt-2 text-sm text-[#7E8796]">{app.description}</p>
        <div className="mt-4">
          <span className="text-xs text-[#7E8796]">{app.requirements}</span>
        </div>
        <div className="mt-4">
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2A2F39] px-5 py-2.5 font-semibold text-[#7E8796] cursor-not-allowed w-full"
          >
            <Clock className="w-4 h-4" />
            Segera Hadir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] p-6 hover:border-[#FFD100]/30 transition-colors">
      <div className="w-12 h-12 rounded-lg border border-[#FFD100]/35 bg-[#FFD100]/10 grid place-items-center mb-4">
        <Icon className="w-6 h-6 text-[#FFD100]" />
      </div>
      <h3 className="text-lg font-bold text-[#F3F4F6]">{app.name}</h3>
      <p className="mt-2 text-sm text-[#C8CFDA]">{app.description}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#9CA3AF]">
        {app.version && <span>v{app.version}</span>}
        {app.size && <span>{app.size}</span>}
        <span>{app.requirements}</span>
      </div>
      <div className="mt-4">
        <a
          href={app.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD100] px-5 py-2.5 font-bold text-[#111317] hover:brightness-95 transition w-full"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Download
        </a>
      </div>
    </div>
  );
};

const DownloadsSection = () => (
  <section id="downloads" className="max-w-7xl mx-auto px-6 py-10 md:py-12">
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-[#F3F4F6]">
        Download Aplikasi
      </h2>
      <p className="text-[#9CA3AF] mt-2">
        Download aplikasi resmi MyGameON untuk pengalaman terbaik.
      </p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {downloads.map((app) => (
        <DownloadCard key={app.id} app={app} />
      ))}
    </div>
  </section>
);

export default DownloadsSection;
