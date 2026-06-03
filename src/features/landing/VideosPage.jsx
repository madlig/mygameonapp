import React, { useState, useEffect } from 'react';
import { Play, Video } from 'lucide-react';
import { tutorials as staticTutorials } from './data/tutorials';
import { tutorialsCRUD } from '../content/services/contentFirestore';
import PageShell from './components/PageShell';
import Seo from '../../components/common/Seo';

/* ── Category definitions ────────────────────────────── */
const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'general', label: 'Umum' },
  { key: 'sims4', label: 'Sims 4' },
  { key: 'troubleshoot', label: 'Troubleshoot' },
];

const categoryLabel = (key) =>
  key === 'sims4' ? 'Sims 4' : key === 'troubleshoot' ? 'Troubleshoot' : 'Umum';

/* ── Video Card ──────────────────────────────────────── */
const VideoCard = ({ tutorial }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const hasVideo = Boolean(tutorial.youtubeId);

  return (
    <div className="rounded-2xl border border-border-default bg-bg-secondary overflow-hidden transition-colors hover:border-accent-yellow/20">
      {/* Thumbnail / Embed */}
      {hasVideo && showEmbed ? (
        <div className="relative w-full aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${tutorial.youtubeId}?autoplay=1`}
            title={tutorial.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : (
        <div
          className={`relative w-full aspect-video bg-bg-primary grid place-items-center ${
            hasVideo ? 'cursor-pointer group' : ''
          }`}
          onClick={hasVideo ? () => setShowEmbed(true) : undefined}
        >
          {hasVideo ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`}
                alt={tutorial.title}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                loading="lazy"
              />
              <div className="relative z-10 w-14 h-14 rounded-full bg-accent-yellow grid place-items-center group-hover:scale-110 transition-transform shadow-lg shadow-accent-yellow/20">
                <Play className="w-6 h-6 text-bg-primary ml-0.5" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2.5 text-text-ghost">
              <Video className="w-10 h-10 opacity-40" />
              <span className="text-[12px] font-semibold">
                Video segera hadir
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-5">
        <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-accent-purple-light bg-accent-purple/10 px-2 py-[3px] rounded-[5px] mb-2.5">
          {categoryLabel(tutorial.category)}
        </span>
        <h3 className="text-[15px] font-bold text-text-primary leading-snug mb-1.5">
          {tutorial.title}
        </h3>
        <p className="text-[12.5px] text-text-dim leading-relaxed">
          {tutorial.description}
        </p>
      </div>
    </div>
  );
};

/* ── Videos Page ─────────────────────────────────────── */
const VideosPage = () => {
  const [tutorials, setTutorials] = useState(staticTutorials);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    tutorialsCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setTutorials(items);
      })
      .catch(() => {});
  }, []);

  const filtered =
    activeCategory === 'all'
      ? tutorials
      : tutorials.filter((t) => t.category === activeCategory);

  return (
    <PageShell title="Video Tutorial" maxWidth={960}>
      <Seo
        title="Video Tutorial"
        description="Panduan lengkap cara install dan main game dari MyGameON. Tutorial download, ekstrak, dan troubleshooting game PC."
        path="/videos"
      />
      {/* Header */}
      <div className="slide-stagger-1 mb-7">
        <h1 className="text-[clamp(28px,3.5vw,40px)] font-black tracking-[-1.2px] leading-[1.08] mb-2.5">
          Video <span className="text-accent-yellow">Tutorial</span>
        </h1>
        <p className="text-text-dim text-[14px] leading-relaxed">
          Panduan video langkah demi langkah untuk install dan menjalankan game.
        </p>
      </div>

      {/* Category pills */}
      <div className="slide-stagger-2 flex gap-1.5 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-[7px] rounded-lg text-[12px] font-semibold cursor-pointer border transition-all duration-150 ${
              activeCategory === cat.key
                ? 'bg-accent-yellow text-bg-primary border-accent-yellow'
                : 'bg-bg-secondary text-text-dim border-border-default hover:border-border-subtle'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="slide-stagger-3">
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((tutorial) => (
              <VideoCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <Video className="w-10 h-10 mx-auto mb-3 text-text-ghost opacity-40" />
            <p className="text-[13px] text-text-ghost">
              Belum ada video untuk kategori ini.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default VideosPage;
