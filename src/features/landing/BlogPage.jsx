import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, TrendingUp } from 'lucide-react';
import { BLOG_ARTICLES, BLOG_CATEGORIES, BLOG_TAGS } from './data/blogArticles';
import { blogsCRUD } from '../content/services/contentFirestore';
import PageShell from './components/PageShell';

/* ── Markdown-lite body renderer ─────────────────────── */
const renderBody = (body) =>
  body.split('\n\n').map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2
          key={i}
          className="text-[18px] font-extrabold text-text-secondary tracking-[-0.3px] mt-7 first:mt-0 mb-3"
        >
          {block.slice(3)}
        </h2>
      );
    }
    return (
      <div key={i} className="mb-4">
        {block.split('\n').map((line, j) => {
          if (line.startsWith('- **') || line.startsWith('**')) {
            const isBullet = line.startsWith('- ');
            const text = isBullet ? line.slice(2) : line;
            const parts = text.split('**').filter(Boolean);
            return (
              <p
                key={j}
                className="text-[14px] text-text-tertiary leading-[1.85] mb-1"
              >
                {isBullet && (
                  <span className="text-accent-yellow mr-1.5">•</span>
                )}
                {parts.map((p, k) =>
                  k % 2 === 0 ? (
                    <strong key={k} className="text-text-muted font-bold">
                      {p}
                    </strong>
                  ) : (
                    <span key={k}>{p}</span>
                  )
                )}
              </p>
            );
          }
          return (
            <p
              key={j}
              className="text-[14px] text-text-tertiary leading-[1.85]"
            >
              {line}
            </p>
          );
        })}
      </div>
    );
  });

/* ── Hero Featured Article ───────────────────────────── */
const HeroArticle = ({ article, onClick }) => (
  <div
    onClick={() => onClick(article)}
    className="hero-article cursor-pointer rounded-[20px] overflow-hidden border border-border-default transition-colors hover:border-[color:var(--cat-color)]/30"
    style={{
      '--cat-color': article.categoryColor,
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      background: '#080A0E',
      minHeight: 380,
    }}
  >
    {/* Cover */}
    <div
      className="relative flex flex-col justify-end p-7"
      style={{
        background: `linear-gradient(145deg, ${article.coverGradient.join(',')})`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.03] dot-grid pointer-events-none" />
      <span
        className="relative inline-block w-fit text-[10px] font-extrabold text-white px-3 py-1 rounded-md mb-2.5 -rotate-[1.5deg]"
        style={{ background: article.categoryColor, letterSpacing: '0.5px' }}
      >
        FEATURED
      </span>
      <p className="relative text-[13px] text-white/40 font-medium">
        {article.date} · {article.readTime} baca
      </p>
    </div>
    {/* Content */}
    <div className="flex flex-col justify-center p-[clamp(24px,3vw,40px)]">
      <span
        className="inline-block w-fit text-[10px] font-extrabold px-2.5 py-[3px] rounded-[5px] mb-4"
        style={{
          background: article.categoryColor + '18',
          color: article.categoryColor,
          letterSpacing: '0.5px',
        }}
      >
        {article.category.toUpperCase()}
      </span>
      <h2 className="text-[clamp(22px,2.4vw,32px)] font-black tracking-[-0.8px] leading-[1.2] text-text-primary mb-3.5">
        {article.title}
      </h2>
      <p className="text-[14px] text-text-tertiary leading-[1.7] mb-5 line-clamp-3">
        {article.excerpt}
      </p>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-bg-surface grid place-items-center text-[10px] font-extrabold text-accent-yellow">
          A
        </div>
        <span className="text-[12px] text-text-dim font-medium">
          {article.author}
        </span>
      </div>
    </div>
  </div>
);

/* ── Article Card ────────────────────────────────────── */
const ArticleCard = ({ article, onClick }) => (
  <article
    onClick={() => onClick(article)}
    className="bg-bg-secondary border border-border-default rounded-[14px] overflow-hidden cursor-pointer flex flex-col transition-all hover:-translate-y-0.5"
    style={{ '--cat-color': article.categoryColor }}
  >
    {/* Mini cover */}
    <div
      className="relative h-[140px]"
      style={{
        background: `linear-gradient(135deg, ${article.coverGradient.join(',')})`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.04] dot-grid" />
      <span
        className="absolute top-2.5 left-2.5 text-[9px] font-extrabold px-2 py-[3px] rounded-[5px] backdrop-blur-sm"
        style={{
          background: article.categoryColor + '20',
          color: article.categoryColor,
          border: `1px solid ${article.categoryColor}30`,
          letterSpacing: '0.3px',
        }}
      >
        {article.category.toUpperCase()}
      </span>
    </div>
    {/* Body */}
    <div className="p-4 flex-1 flex flex-col">
      <h3 className="text-[14.5px] font-extrabold text-text-secondary leading-[1.35] mb-2 line-clamp-2">
        {article.title}
      </h3>
      <p className="text-[12px] text-text-dim leading-[1.6] flex-1 line-clamp-2">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-bg-surface">
        <span className="text-[10.5px] text-text-hidden">
          {article.date} · {article.readTime}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ color: article.categoryColor }}
        >
          Baca →
        </span>
      </div>
    </div>
  </article>
);

/* ── Sidebar ─────────────────────────────────────────── */
const Sidebar = ({ articles, onArticleClick }) => {
  const trending = articles.filter((a) => a.trending).slice(0, 4);
  return (
    <aside className="blog-sidebar flex flex-col gap-5">
      {/* Trending */}
      <div className="bg-bg-secondary border border-border-default rounded-[14px] p-4">
        <h3 className="text-[12px] font-extrabold text-accent-yellow tracking-[1.5px] uppercase mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Trending
        </h3>
        <div className="flex flex-col gap-3">
          {trending.map((a, i) => (
            <div
              key={a.id}
              onClick={() => onArticleClick(a)}
              className={`flex gap-3 cursor-pointer py-2 ${
                i < trending.length - 1 ? 'border-b border-bg-surface' : ''
              }`}
            >
              <span className="text-[22px] font-black text-border-default leading-none min-w-[28px]">
                0{i + 1}
              </span>
              <div>
                <span
                  className="text-[9px] font-bold tracking-[0.3px]"
                  style={{ color: a.categoryColor }}
                >
                  {a.category.toUpperCase()}
                </span>
                <h4 className="text-[12.5px] font-bold text-text-muted leading-[1.35] mt-0.5">
                  {a.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-bg-secondary border border-border-default rounded-[14px] p-4">
        <h3 className="text-[12px] font-extrabold text-text-tertiary tracking-[1.5px] uppercase mb-3.5">
          Topik
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {BLOG_TAGS.map((tag) => (
            <span
              key={tag}
              className="bg-bg-primary border border-border-subtle text-text-faint text-[10.5px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:border-accent-yellow hover:text-accent-yellow"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative bg-bg-secondary border border-accent-purple/[0.15] rounded-[14px] p-4 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent-purple/[0.15] rounded-full blur-[30px] pointer-events-none" />
        <p className="relative text-[13px] font-extrabold text-text-secondary mb-1.5">
          Game belum ada?
        </p>
        <p className="relative text-[11.5px] text-text-dim mb-3.5 leading-relaxed">
          Request langsung dan kami carikan untukmu.
        </p>
        <Link
          to="/request-game"
          className="btn-yellow relative block text-center bg-accent-yellow text-bg-primary py-2.5 rounded-[9px] text-[12px] font-extrabold no-underline"
        >
          Request Game
        </Link>
      </div>
    </aside>
  );
};

/* ── Article Reader View ─────────────────────────────── */
const ArticleReader = ({ article, allArticles, onBack, onArticleClick }) => {
  const related = allArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 2);

  return (
    <div className="max-w-[720px] mx-auto py-4 pb-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-text-dim text-[13px] font-semibold mb-8 p-0 transition-colors hover:text-text-primary"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Kembali ke Blog
      </button>

      {/* Cover */}
      <div
        className="h-[240px] rounded-[18px] mb-7 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${article.coverGradient.join(',')})`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.04] dot-grid" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2.5 flex-wrap mb-5">
        <span
          className="text-[10px] font-extrabold px-2.5 py-1 rounded-[5px]"
          style={{
            background: article.categoryColor + '18',
            color: article.categoryColor,
          }}
        >
          {article.category.toUpperCase()}
        </span>
        <span className="text-[12px] text-text-ghost">
          {article.date} · {article.readTime} baca
        </span>
        <span className="text-[12px] text-text-ghost">
          oleh {article.author}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[clamp(26px,3.5vw,40px)] font-black tracking-[-1.2px] leading-[1.15] text-text-primary mb-7">
        {article.title}
      </h1>

      {/* Body */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-[clamp(20px,3vw,32px)]">
        {renderBody(article.body)}
      </div>

      {/* CTAs */}
      <div className="mt-7 flex gap-2.5">
        <Link
          to="/request-game"
          className="btn-yellow flex-1 flex items-center justify-center bg-accent-yellow text-bg-primary py-3.5 rounded-xl font-bold text-[13px] no-underline"
        >
          Request Game
        </Link>
        <Link
          to="/"
          className="flex-1 flex items-center justify-center bg-bg-secondary border border-border-default text-text-tertiary py-3.5 rounded-xl font-semibold text-[13px] no-underline transition-colors hover:border-accent-yellow/30"
        >
          Lihat Katalog
        </Link>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h3 className="text-[14px] font-extrabold text-text-tertiary tracking-[1px] uppercase mb-4">
            Artikel Terkait
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} onClick={onArticleClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Blog Page (main) ────────────────────────────────── */
const BlogPage = () => {
  const [articles, setArticles] = useState(BLOG_ARTICLES);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [reading, setReading] = useState(null);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    blogsCRUD
      .loadActive()
      .then((items) => {
        if (items.length > 0) setArticles(items);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        const catMatch =
          activeCategory === 'Semua' || a.category === activeCategory;
        const q = searchQ.toLowerCase();
        const searchMatch =
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q);
        return catMatch && searchMatch;
      }),
    [activeCategory, searchQ, articles]
  );

  const featured = articles.find((a) => a.featured);
  const nonFeatured = filtered.filter(
    (a) => !a.featured || activeCategory !== 'Semua'
  );

  const openArticle = (a) => {
    setReading(a);
    window.scrollTo(0, 0);
  };
  const goHome = () => {
    setReading(null);
    window.scrollTo(0, 0);
  };

  /* ── Reader view ── */
  if (reading) {
    return (
      <PageShell title="Blog" maxWidth={1100}>
        <ArticleReader
          article={reading}
          allArticles={articles}
          onBack={goHome}
          onArticleClick={openArticle}
        />
      </PageShell>
    );
  }

  /* ── Listing view ── */
  return (
    <PageShell title="Blog" maxWidth={1100}>
      {/* Header */}
      <div className="slide-stagger-1 mb-7">
        <h1 className="text-[clamp(30px,3.5vw,44px)] font-black tracking-[-1.5px] leading-[1.05] mb-2">
          Blog &{' '}
          <span className="bg-gradient-to-r from-accent-orange to-accent-red bg-clip-text text-transparent">
            Update
          </span>
        </h1>
        <p className="text-text-dim text-[14.5px]">
          Info terkini, tips, tutorial, dan update game dari tim MyGameON.
        </p>
      </div>

      {/* Category bar + search */}
      <div className="slide-stagger-2 cat-bar flex items-center gap-2 flex-wrap mb-7">
        {BLOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-[9px] text-[12px] font-bold cursor-pointer border whitespace-nowrap transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-accent-yellow text-bg-primary border-accent-yellow'
                : 'bg-bg-secondary text-text-dim border-border-default hover:border-border-subtle'
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-faint pointer-events-none" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Cari artikel..."
            className="w-full py-2 pl-8 pr-3 bg-bg-secondary border border-border-default rounded-[9px] text-[12px] text-text-primary placeholder-text-faint focus:outline-none focus:border-accent-yellow/[0.35] transition-colors font-[inherit]"
          />
        </div>
      </div>

      {/* Featured hero */}
      {activeCategory === 'Semua' && !searchQ && featured && (
        <div className="slide-stagger-2 mb-7">
          <HeroArticle article={featured} onClick={openArticle} />
        </div>
      )}

      {/* Main + Sidebar */}
      <div
        className="blog-layout slide-stagger-3"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 20,
        }}
      >
        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 12,
            alignContent: 'start',
          }}
        >
          {nonFeatured.length > 0 ? (
            nonFeatured.map((a) => (
              <ArticleCard key={a.id} article={a} onClick={openArticle} />
            ))
          ) : (
            <div style={{ gridColumn: '1/-1' }} className="text-center py-12">
              <p className="text-text-ghost text-[13px]">
                Tidak ada artikel yang cocok.
              </p>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <Sidebar articles={articles} onArticleClick={openArticle} />
      </div>
    </PageShell>
  );
};

export default BlogPage;
