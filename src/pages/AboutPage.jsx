import React from 'react';
import {
  InformationCircleIcon,
  CpuChipIcon,
  LinkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const APP_VERSION = '1.0.0';
const BUILD_DATE = '2026-05-27';

const techStack = [
  { name: 'React', detail: '18.x' },
  { name: 'Vite', detail: '6.x' },
  { name: 'Tailwind CSS', detail: '3.4' },
  { name: 'Firebase', detail: 'Auth, Firestore' },
  { name: 'Headless UI', detail: 'Components' },
  { name: 'Heroicons + Lucide', detail: 'Icons' },
];

const quickLinks = [
  { label: 'Landing Page', url: '/', internal: true },
  { label: 'Shopee Store', url: 'https://shopee.co.id/mygameon' },
  { label: 'WhatsApp Admin', url: 'https://wa.me/6285121309829' },
  { label: 'Firebase Console', url: 'https://console.firebase.google.com' },
];

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl border border-[#2A2F39] bg-[#111317] p-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg border border-[#2F3643] bg-[#1A1F27] grid place-items-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-[#FFD100]" />
      </div>
      <h3 className="font-bold text-[#F3F4F6]">{title}</h3>
    </div>
    {children}
  </div>
);

const AboutPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F3F4F6]">System Info</h1>
        <p className="text-sm text-[#7E8796] mt-1">
          Informasi teknis tentang MyGameON Hub.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* App Info */}
        <SectionCard icon={InformationCircleIcon} title="App Info">
          <dl className="space-y-2.5 text-sm">
            {[
              ['Nama Aplikasi', 'MyGameON Hub'],
              ['Versi', `v${APP_VERSION}`],
              ['Build Date', BUILD_DATE],
              ['Environment', import.meta.env.MODE],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <dt className="text-[#7E8796]">{label}</dt>
                <dd className="text-[#C8CFDA] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        {/* Tech Stack */}
        <SectionCard icon={CpuChipIcon} title="Tech Stack">
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2F39] bg-[#1A1F27] px-3 py-1.5 text-xs"
              >
                <span className="font-semibold text-[#C8CFDA]">
                  {tech.name}
                </span>
                <span className="text-[#7E8796]">{tech.detail}</span>
              </span>
            ))}
          </div>
        </SectionCard>

        {/* Quick Links */}
        <SectionCard icon={LinkIcon} title="Quick Links">
          <div className="space-y-1.5">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target={link.internal ? '_self' : '_blank'}
                rel={link.internal ? undefined : 'noopener noreferrer'}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#C8CFDA] hover:bg-[#1A1F27] hover:text-[#FFD100] transition-colors group"
              >
                <span>{link.label}</span>
                <svg
                  className="w-3.5 h-3.5 text-[#7E8796] group-hover:text-[#FFD100] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5"
                  />
                </svg>
              </a>
            ))}
          </div>
        </SectionCard>

        {/* Credits */}
        <SectionCard icon={UserCircleIcon} title="Credits">
          <div className="text-sm space-y-3">
            <div>
              <p className="text-[#C8CFDA] font-medium">MyGameON Team</p>
              <p className="text-[#7E8796] text-xs mt-0.5">
                Gamer Street &bull; Game service & distribution
              </p>
            </div>
            <div className="pt-2 border-t border-[#2A2F39]">
              <p className="text-[10px] text-[#7E8796] uppercase tracking-wider">
                Admin Dashboard &bull; Internal Use Only
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AboutPage;
