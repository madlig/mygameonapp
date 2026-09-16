import React from 'react';
import { Wrench, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const TOOLS = [
  {
    name: 'Visual C++ All-in-One',
    desc: 'Wajib untuk mengatasi error MSVCP140.dll, VCRUNTIME140.dll, dan 0xc000007b.',
    tag: 'Paket Komplit (2005-2022)',
    link: 'https://www.techpowerup.com/download/visual-c-redistributable-runtime-package-all-in-one/',
    isExternal: true,
  },
  {
    name: 'DirectX End-User Runtime',
    desc: 'Wajib untuk mengatasi missing d3dx9_43.dll, XINPUT1_3.dll, dan crash rendering game.',
    tag: 'Microsoft Official Web Installer',
    link: 'https://www.microsoft.com/en-us/download/details.aspx?id=35',
    isExternal: true,
  },
  {
    name: 'WinRAR / 7-Zip Official',
    desc: 'Software dekompresi terbaik untuk membuka file part game tanpa resiko file corrupt.',
    tag: 'Extractor Standar',
    link: 'https://www.win-rar.com/download.html',
    isExternal: true,
  },
];

const ToolkitSection = () => {
  return (
    <section id="toolkit" className="px-4 sm:px-8 py-14 sm:py-18 max-w-6xl mx-auto border-t border-white/5">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 text-xs font-bold uppercase tracking-wider mb-3">
          <Wrench size={14} className="text-amber-400" />
          <span>Essential PC Gaming Toolkit</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 font-display">
          Toolkit Pendukung Game Bebas Crash
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Baru install ulang Windows atau game tidak mau terbuka? Pastikan 3 komponen dasar Windows berikut sudah terinstall di PC Anda.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {TOOLS.map((tool, idx) => (
          <div
            key={idx}
            className="bg-[#0A0D14] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-md"
          >
            <div>
              <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-white/5 text-amber-400 border border-white/5 mb-3 font-mono">
                {tool.tag}
              </span>
              <h3 className="font-bold text-sm text-white mb-1.5">{tool.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{tool.desc}</p>
            </div>

            <a
              href={tool.link}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all border border-white/5"
            >
              <span>Download Resmi</span>
              <ExternalLink size={13} className="text-slate-400" />
            </a>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/downloads"
          className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
        >
          <span>Lihat Semua File Installer & Software Pendukung di Halaman Downloads</span>
          <Download size={14} />
        </Link>
      </div>
    </section>
  );
};

export default ToolkitSection;
