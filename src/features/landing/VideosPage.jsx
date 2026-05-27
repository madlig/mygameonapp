import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Video, Filter } from 'lucide-react';
import { tutorials as staticTutorials } from './data/tutorials';
import { tutorialsCRUD } from '../content/services/contentFirestore';

const categories = [
  { key: 'all', label: 'Semua' },
  { key: 'general', label: 'Umum' },
  { key: 'sims4', label: 'Sims 4' },
  { key: 'troubleshoot', label: 'Troubleshoot' },
];

const VideoCard = ({ tutorial }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const hasVideo = Boolean(tutorial.youtubeId);

  return (
    <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden hover:border-[#FFD100]/20 transition-colors">
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
          className={`relative w-full aspect-video bg-[#0D1117] grid place-items-center ${hasVideo ? 'cursor-pointer group' : ''}`}
          onClick={hasVideo ? () => setShowEmbed(true) : undefined}
        >
          {hasVideo ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`}
                alt={tutorial.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                loading="lazy"
              />
              <div className="relative z-10 w-16 h-16 rounded-full bg-[#FFD100] grid place-items-center group-hover:scale-110 transition-transform shadow-lg shadow-[#FFD100]/20">
                <Play className="w-7 h-7 text-[#111317] ml-0.5" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#7E8796]">
              <Video className="w-12 h-12 opacity-40" />
              <span className="text-sm font-medium">Video segera hadir</span>
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#FFD100]/70 mb-2">
          {tutorial.category === 'sims4'
            ? 'Sims 4'
            : tutorial.category === 'troubleshoot'
              ? 'Troubleshoot'
              : 'Umum'}
        </span>
        <h3 className="font-bold text-[#F3F4F6] text-lg leading-snug">
          {tutorial.title}
        </h3>
        <p className="mt-2 text-sm text-[#9CA3AF] leading-relaxed">
          {tutorial.description}
        </p>
      </div>
    </div>
  );
};

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
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2A2F39] bg-[#111317]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <div className="h-4 w-px bg-[#2A2F39]" />
          <span className="text-sm font-semibold text-[#F3F4F6]">
            Video Tutorial
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Video Tutorial
          </h1>
          <p className="mt-3 text-[#9CA3AF] text-lg">
            Panduan video langkah demi langkah untuk install dan menjalankan
            game.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Filter className="w-4 h-4 text-[#7E8796]" />
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-[#FFD100] text-[#111317]'
                  : 'bg-[#1A1F27] text-[#9CA3AF] border border-[#2A2F39] hover:text-[#F3F4F6] hover:border-[#FFD100]/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Video grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((tutorial) => (
              <VideoCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#7E8796]">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada video untuk kategori ini.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideosPage;
