import React, { useState } from 'react';
import { Play, Video } from 'lucide-react';
import { tutorials } from '../data/tutorials';

const TutorialCard = ({ tutorial }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const hasVideo = Boolean(tutorial.youtubeId);

  if (hasVideo && showEmbed) {
    return (
      <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden">
        <div className="relative w-full aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${tutorial.youtubeId}`}
            title={tutorial.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="p-4">
          <h4 className="font-bold text-[#F3F4F6]">{tutorial.title}</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden">
      <div
        className={`relative w-full aspect-video bg-[#111317] grid place-items-center ${hasVideo ? 'cursor-pointer group' : ''}`}
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
            <div className="relative z-10 w-14 h-14 rounded-full bg-[#FFD100] grid place-items-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-[#111317] ml-0.5" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#7E8796]">
            <Video className="w-10 h-10" />
            <span className="text-xs font-medium">Video segera hadir</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-[#F3F4F6]">{tutorial.title}</h4>
        <p className="mt-1 text-sm text-[#9CA3AF]">{tutorial.description}</p>
      </div>
    </div>
  );
};

const VideoTutorialsSection = () => (
  <section id="tutorials" className="max-w-7xl mx-auto px-6 py-10 md:py-12">
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-[#F3F4F6]">
        Video Tutorial
      </h2>
      <p className="text-[#9CA3AF] mt-2">
        Panduan video untuk membantu kamu install dan menggunakan game.
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tutorials.map((tutorial) => (
        <TutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  </section>
);

export default VideoTutorialsSection;
