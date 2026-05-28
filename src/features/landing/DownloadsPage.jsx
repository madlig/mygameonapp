import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Download,
  Monitor,
  Cpu,
  Archive,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { downloads as staticDownloads } from './data/downloads';
import { prerequisites as staticPrereqs } from './data/prerequisites';
import {
  downloadsCRUD,
  prerequisitesCRUD,
} from '../content/services/contentFirestore';
import PageShell from './components/PageShell';

/* ── Icon map ────────────────────────────────────────── */
const ICONS = {
  'gamepad-2': Gamepad2,
  download: Download,
  monitor: Monitor,
  cpu: Cpu,
  archive: Archive,
};

/* ── App Card ────────────────────────────────────────── */
const AppCard = ({ app }) => {
  const Icon = ICONS[app.icon] || Download;

  return (
    <div className="rounded-2xl border border-border-default bg-bg-secondary p-5 transition-colors hover:border-accent-yellow/20">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-yellow/10">
          <Icon className="w-5 h-5 text-accent-yellow" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-text-primary mb-1">
            {app.name}
          </h3>
          <p className="text-[12.5px] text-text-dim leading-relaxed mb-3">
            {app.description}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {app.version && (
              <span className="text-[10px] font-bold text-text-ghost bg-bg-surface px-2 py-[3px] rounded-md border border-border-default">
                v{app.version}
              </span>
            )}
            {app.size && (
              <span className="text-[10px] text-text-ghost">{app.size}</span>
            )}
            {app.requirements && (
              <span className="text-[10px] text-text-ghost">
                {app.requirements}
              </span>
            )}
          </div>

          {/* Action */}
          {app.isAvailable !== false ? (
            <a
              href={app.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-[7px] rounded-lg bg-accent-yellow text-[12px] font-bold text-bg-primary btn-yellow"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-[7px] rounded-lg bg-bg-surface border border-border-default text-[12px] font-semibold text-text-ghost">
              <Clock className="w-3.5 h-3.5" />
              {app.comingSoonNote || 'Segera hadir'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Prereq Card ─────────────────────────────────────── */
const PrereqCard = ({ item }) => {
  const Icon = ICONS[item.icon] || Monitor;

  return (
    <div className="rounded-2xl border border-border-default bg-bg-secondary p-4 transition-colors hover:border-accent-purple/20">
      <div className="flex items-start gap-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-purple/10">
          <Icon className="w-4 h-4 text-accent-purple-light" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-text-primary mb-0.5">
            {item.name}
          </h3>
          <p className="text-[12px] text-text-dim leading-relaxed mb-2">
            {item.description}
          </p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-purple-light hover:text-accent-purple transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Downloads Page ───────────────────────────────────── */
const DownloadsPage = () => {
  const [apps, setApps] = useState(staticDownloads);
  const [prereqs, setPrereqs] = useState(staticPrereqs);

  useEffect(() => {
    downloadsCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setApps(items);
      })
      .catch(() => {});
    prerequisitesCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setPrereqs(items);
      })
      .catch(() => {});
  }, []);

  return (
    <PageShell title="Downloads" maxWidth={720}>
      {/* Header */}
      <div className="slide-stagger-1 mb-8">
        <h1 className="text-[clamp(28px,3.5vw,40px)] font-black tracking-[-1.2px] leading-[1.08] mb-2.5">
          Download <span className="text-accent-yellow">Aplikasi</span>
        </h1>
        <p className="text-text-dim text-[14px] leading-relaxed">
          Download launcher dan software pendukung untuk menjalankan game.
        </p>
      </div>

      {/* Apps Section */}
      <section className="slide-stagger-2 mb-10">
        <h2 className="text-[13px] font-extrabold uppercase tracking-wider text-accent-yellow mb-4">
          Aplikasi MyGameON
        </h2>
        <div className="space-y-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      {/* Prerequisites Section */}
      <section className="slide-stagger-3">
        <h2 className="text-[13px] font-extrabold uppercase tracking-wider text-accent-purple-light mb-4">
          Software Pendukung
        </h2>
        <p className="text-[12.5px] text-text-dim leading-relaxed mb-4">
          Install software berikut sebelum menjalankan game agar tidak terjadi
          error.
        </p>
        <div className="space-y-2.5">
          {prereqs.map((item) => (
            <PrereqCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </PageShell>
  );
};

export default DownloadsPage;
