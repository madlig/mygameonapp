/* lp-sections.jsx — WinningProduct, BentoFeatures, Catalog, Blog, CTA, Footer */
const { useState, useEffect, useRef } = React;

/* ── Simple wrapper helpers (no animation) ───────────── */
const Reveal = ({ children, style, delay = 0 }) => {
  return <div style={style}>{children}</div>;
};
const Stagger = ({ children, style }) => {
  return <div style={style}>{children}</div>;
};
const SI = ({ children, style }) => (
  <div style={style}>{children}</div>
);

/* ── Winning Product Spotlight ───────────────────────── */
const WINNING = {
  title: 'Cyberpunk 2077',
  sub: 'Ultimate Edition — Update 2.2',
  genre: 'RPG · Open World · AAA',
  size: '70.8 GB',
  price: 'Rp 25.000',
  oldPrice: 'Rp 45.000',
  tags: ['Bestseller', 'Baru Update'],
  desc: 'Night City menunggumu. Jelajahi kota futuristik dengan grafis ray-tracing, storyline epik, dan ratusan jam gameplay.',
  colors: ['#1a0533', '#3b0764', '#581c87'],
};

const WinningProduct = () => {
  const [hov, setHov] = useState(false);
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 3, height: 24, background: '#FFD100', borderRadius: 2 }} />
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#FFD100', letterSpacing: '2px', textTransform: 'uppercase' }}>Winning Product</h2>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', border: `1px solid ${hov ? 'rgba(139,92,246,0.3)' : '#1A1F27'}`, background: '#0D0F14', transition: 'border-color 0.3s ease', minHeight: 360, cursor: 'pointer' }}
          className="winning-card"
        >
          {/* Visual */}
          <div style={{ background: `linear-gradient(155deg, ${WINNING.colors[0]}, ${WINNING.colors[1]}, ${WINNING.colors[2]})`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 70%, rgba(139,92,246,0.3) 0%, transparent 60%)', pointerEvents: 'none' }} />
            {/* Large title as visual */}
            <div style={{ position: 'relative', textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 'clamp(40px, 4vw, 56px)', fontWeight: 900, color: 'rgba(255,255,255,0.1)', letterSpacing: '-2px', lineHeight: 0.95, marginBottom: 12 }}>CYBER<br />PUNK</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '3px' }}>2 0 7 7</div>
            </div>
            {/* Sticker badges */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6 }}>
              {WINNING.tags.map(tag => (
                <span key={tag} style={{ background: tag === 'Bestseller' ? '#FFD100' : '#EF4444', color: tag === 'Bestseller' ? '#0D0F14' : '#fff', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 6, transform: 'rotate(-2deg)', display: 'inline-block', letterSpacing: '0.4px' }}>{tag.toUpperCase()}</span>
              ))}
            </div>
            {/* Price badge */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#6B7280', textDecoration: 'line-through' }}>{WINNING.oldPrice}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFD100', letterSpacing: '-0.5px' }}>{WINNING.price}</div>
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: 'clamp(24px, 3vw, 44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#8B5CF6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>{WINNING.genre}</div>
            <h3 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 900, color: '#F3F4F6', letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 6 }}>{WINNING.title}</h3>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 18 }}>{WINNING.sub}</p>
            <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.7, marginBottom: 28 }}>{WINNING.desc}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <a href="#" className="btn-yellow" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#EE4D2D', color: '#fff', padding: '13px 0', borderRadius: 11, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14.8c0 .1.1.2.2.2h12V13H7.5L5.2 2H2v2h2l3.6 7.6L6.2 14c-.1.3-.2.6-.2 1 0 1.1.9 2 2 2h12v-2H8.1c-.1 0-.2-.1-.2-.2v-.1l.7-1.2h7.5c.8 0 1.5-.4 1.8-1.1l3.6-6.5c.2-.3-.1-.7-.5-.7H6.5l-.9-2H2"/></svg>
                Beli di Shopee
              </a>
              <a href="#" style={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#15803D', color: '#fff', borderRadius: 11, textDecoration: 'none', transition: 'filter 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.filter='brightness(1.15)'}
                onMouseLeave={e => e.currentTarget.style.filter='none'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.428-9.888 9.891 0 2.098.61 4.13 1.737 5.932l-.985 3.628 3.743-.981z"/></svg>
              </a>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#374151' }}>
              <span>{WINNING.size}</span>
              <span>·</span>
              <span>Windows 10+</span>
              <span>·</span>
              <span>Instant delivery</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
window.WinningProduct = WinningProduct;

/* ── Bento Features Grid ─────────────────────────────── */
const BentoFeatures = () => {
  const cells = [
    { span: 'wide', icon: '01', title: 'Cari & Temukan Instant', body: 'Ketik nama game, langsung ketemu. Search engine kami dirancang untuk hasil cepat tanpa loading lama.', accent: '#FFD100' },
    { span: 'tall', icon: '02', title: 'Request Tanpa Ribet', body: 'Isi form singkat, tanpa login, tanpa registrasi. Game belum ada? Kami carikan.', accent: '#8B5CF6' },
    { span: 'normal', icon: '03', title: 'Tracking Real-time', body: 'Setiap request punya kode unik. Pantau status dari pending sampai ready.', accent: '#22D3EE' },
    { span: 'normal', icon: '04', title: 'Support via WhatsApp', body: 'Butuh bantuan install? Tim kami siap remote install via AnyDesk/TeamViewer.', accent: '#22C55E' },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      <Reveal style={{ marginBottom: 36 }}>
        <p style={{ color: '#8B5CF6', fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 10 }}>Kenapa MyGameON?</p>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.08, color: '#F3F4F6' }}>
          Dibuat untuk gamer<br />yang nggak mau ribet.
        </h2>
      </Reveal>
      <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto', gap: 10 }} className="bento-grid">
        {cells.map((c, i) => {
          const gridStyle = c.span === 'wide' ? { gridColumn: 'span 2' } : c.span === 'tall' ? { gridRow: 'span 2' } : {};
          return (
            <SI key={i} style={gridStyle}>
              <div className="bento-cell" style={{ background: '#0D0F14', border: '1px solid #151920', borderRadius: 16, padding: c.span === 'tall' ? '28px 24px' : '24px', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s, box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent + '40'; e.currentTarget.style.boxShadow = `0 0 32px ${c.accent}15`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#151920'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: c.span === 'tall' ? 24 : 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: c.accent + '12', border: `1px solid ${c.accent}25`, display: 'grid', placeItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: c.accent }}>{c.icon}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: c.span === 'wide' ? 18 : 15.5, fontWeight: 800, color: '#E5E7EB', marginBottom: 8, lineHeight: 1.25, letterSpacing: '-0.3px' }}>{c.title}</h3>
                <p style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.65, flex: 1 }}>{c.body}</p>
                {c.span === 'tall' && (
                  <div style={{ marginTop: 20, padding: '14px 16px', background: '#111317', borderRadius: 10, border: '1px solid #1A1F27' }}>
                    <div style={{ fontSize: 10, color: '#374151', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px' }}>CONTOH</div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>"Halo, saya mau request <span style={{ color: '#A78BFA' }}>Tekken 8</span> dong."</div>
                  </div>
                )}
              </div>
            </SI>
          );
        })}
      </Stagger>
    </section>
  );
};
window.BentoFeatures = BentoFeatures;

/* ── Game Catalog ────────────────────────────────────── */
const GAMES = [
  { id:1, title:'Cyberpunk 2077',          genre:'RPG',             size:'70.8 GB', tags:['Open World','AAA'],          badge:'Update',  c:['#0c0121','#3b0764'] },
  { id:2, title:'Elden Ring',              genre:'Action RPG',      size:'44.5 GB', tags:['AAA','Story Rich'],          badge:null,      c:['#1c0e05','#7c2d12'] },
  { id:3, title:'Red Dead Redemption 2',   genre:'Action Adventure',size:'120 GB',  tags:['Open World','Story Rich'],   badge:null,      c:['#050e0d','#064e3b'] },
  { id:4, title:'Grand Theft Auto V',      genre:'Action',          size:'95 GB',   tags:['Open World','AAA'],          badge:'Populer', c:['#060914','#1e3a5f'] },
  { id:5, title:'The Witcher 3',           genre:'RPG',             size:'50.2 GB', tags:['Open World','Story Rich'],   badge:null,      c:['#091209','#14532d'] },
  { id:6, title:'Resident Evil 4 Remake',  genre:'Survival Horror', size:'67 GB',   tags:['AAA','Story Rich'],          badge:'Update',  c:['#14060a','#7f1d1d'] },
  { id:7, title:'Hogwarts Legacy',         genre:'Action RPG',      size:'76 GB',   tags:['Open World','Story Rich'],   badge:null,      c:['#0d0318','#581c87'] },
  { id:8, title:'EA Sports FC 25',         genre:'Sports',          size:'47 GB',   tags:['Co-op','Gamepad Support'],   badge:null,      c:['#060b16','#1e3a8a'] },
];

const CatalogCard = ({ game }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className="game-card-hover" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#0D0F14', border: `1px solid ${hov ? 'rgba(255,209,0,0.25)' : '#151920'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: hov ? '0 12px 36px rgba(0,0,0,0.5)' : 'none' }}>
      <div style={{ aspectRatio: '4/3', background: `linear-gradient(145deg, ${game.c[0]}, ${game.c[1]})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>{game.genre}</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 12.5, lineHeight: 1.2 }}>{game.title}</div>
        </div>
        {game.badge && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: game.badge === 'Populer' ? '#F97316' : '#EF4444', color: '#fff', fontSize: 8.5, fontWeight: 800, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.5px' }}>{game.badge.toUpperCase()}</span>
        )}
      </div>
      <div style={{ padding: '12px 12px 13px' }}>
        <h4 style={{ fontWeight: 700, fontSize: 13, color: '#D1D5DB', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.title}</h4>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {game.tags.slice(0,2).map(t => <span key={t} style={{ background: '#111317', border: '1px solid #1A1F27', color: '#4B5563', fontSize: 9.5, padding: '2px 7px', borderRadius: 5 }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 10.5, color: '#2A2F39', marginBottom: 10 }}>{game.size}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <a href="#" style={{ flex: 1, background: '#EE4D2D', color: '#fff', padding: '8px 0', borderRadius: 8, fontSize: 11.5, fontWeight: 700, textAlign: 'center', textDecoration: 'none', transition: 'filter 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter='none'}
          >Shopee</a>
          <a href="#" style={{ width: 34, background: '#15803D', color: '#fff', borderRadius: 8, display: 'grid', placeItems: 'center', textDecoration: 'none', transition: 'filter 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter='none'}
          ><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.428-9.888 9.891 0 2.098.61 4.13 1.737 5.932l-.985 3.628 3.743-.981z"/></svg></a>
        </div>
      </div>
    </div>
  );
};

const Catalog = () => {
  const [q, setQ] = useState('');
  const filtered = q ? GAMES.filter(g => g.title.toLowerCase().includes(q.toLowerCase())) : GAMES;
  return (
    <section id="catalog" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      <Reveal style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: '#2A2F39', fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Katalog</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1.2px', color: '#F3F4F6', lineHeight: 1.08 }}>Koleksi Game</h2>
          </div>
          <span style={{ color: '#1F2937', fontSize: 12, fontWeight: 600 }}>{filtered.length} game</span>
        </div>
      </Reveal>
      <Reveal delay={50} style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" fill="none" stroke="#374151" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari game..."
            style={{ width: '100%', background: '#080A0E', border: '1px solid #151920', borderRadius: 11, padding: '12px 16px 12px 42px', color: '#F3F4F6', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor='rgba(255,209,0,0.35)'}
            onBlur={e => e.target.style.borderColor='#151920'}
          />
        </div>
      </Reveal>
      <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
        {filtered.length > 0 ? filtered.map(g => <SI key={g.id}><CatalogCard game={g} /></SI>) : (
          <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#2A2F39', fontSize: 14, marginBottom: 16 }}>Tidak ditemukan.</p>
            <a href="Request Game.html" className="btn-yellow" style={{ display: 'inline-block', background: '#FFD100', color: '#0D0F14', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Request Game Ini</a>
          </div>
        )}
      </Stagger>
    </section>
  );
};
window.Catalog = Catalog;

/* ── Blog / News Section ─────────────────────────────── */
const BLOG_POSTS = [
  { id: 1, tag: 'Update', tagColor: '#EF4444', title: 'Cyberpunk 2077 Patch 2.2 — Apa yang Baru?', excerpt: 'Update terbesar tahun ini membawa fitur ray-tracing baru, quest tambahan, dan peningkatan performa signifikan.', date: '25 Mei 2026', readTime: '3 min' },
  { id: 2, tag: 'Tips', tagColor: '#8B5CF6', title: '5 Game PC Ringan yang Seru untuk Low-Spec', excerpt: 'Spek PC terbatas? Tenang. Ini rekomendasi game seru yang bisa jalan di RAM 4GB dan GPU integrated.', date: '22 Mei 2026', readTime: '4 min' },
  { id: 3, tag: 'News', tagColor: '#F97316', title: 'GTA VI — Semua yang Perlu Kamu Tahu', excerpt: 'Rockstar akhirnya rilis trailer kedua. Apa saja yang sudah dikonfirmasi? Kami rangkum semuanya di sini.', date: '20 Mei 2026', readTime: '5 min' },
  { id: 4, tag: 'Tutorial', tagColor: '#22D3EE', title: 'Cara Install Game dari Google Drive — Panduan Lengkap', excerpt: 'Step by step download, extract, dan install game yang kamu beli dari MyGameON. Pemula friendly.', date: '18 Mei 2026', readTime: '6 min' },
];

const BlogSection = () => (
  <section id="blog" style={{ background: '#080A0E', borderTop: '1px solid #111317', borderBottom: '1px solid #111317' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
      <Reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <div>
          <p style={{ color: '#F97316', fontWeight: 700, fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>Blog & Update</p>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-1px', color: '#F3F4F6', lineHeight: 1.1 }}>Info Terkini Dunia Game</h2>
        </div>
        <a href="Blog.html" style={{ fontSize: 13, fontWeight: 700, color: '#FFD100', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Lihat Semua
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
      </Reveal>
      <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {BLOG_POSTS.map(post => (
          <SI key={post.id}>
            <article style={{ background: '#0D0F14', border: '1px solid #151920', borderRadius: 14, padding: '22px 20px', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' }}
              className="blog-card-hover"
              onMouseEnter={e => { e.currentTarget.style.borderColor = post.tagColor + '40'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#151920'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ background: post.tagColor + '18', color: post.tagColor, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 5, letterSpacing: '0.5px' }}>{post.tag.toUpperCase()}</span>
                <span style={{ fontSize: 10.5, color: '#2A2F39' }}>{post.date}</span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#E5E7EB', lineHeight: 1.35, marginBottom: 10, letterSpacing: '-0.2px' }}>{post.title}</h3>
              <p style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.65, flex: 1 }}>{post.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #151920' }}>
                <span style={{ fontSize: 10.5, color: '#2A2F39', fontWeight: 500 }}>{post.readTime} baca</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: post.tagColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Baca
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
              </div>
            </article>
          </SI>
        ))}
      </Stagger>
    </div>
  </section>
);
window.BlogSection = BlogSection;

/* ── CTA Banner ──────────────────────────────────────── */
const CTABanner = () => (
  <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
    <Reveal>
      <div style={{ background: 'linear-gradient(135deg, #0D0F14 0%, #110D1E 100%)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 20, padding: 'clamp(32px, 4vw, 56px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'rgba(139,92,246,0.2)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '20%', width: 200, height: 200, background: 'rgba(255,209,0,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 28 }}>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 900, color: '#F3F4F6', marginBottom: 10, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
              Game Belum Ada?<br /><span style={{ color: '#FFD100' }}>Request Sekarang.</span>
            </h2>
            <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.65, maxWidth: 420 }}>Kami review setiap request satu per satu. Proses jelas, transparan dari awal sampai ready.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="Request Game.html" className="btn-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD100', color: '#0D0F14', padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
              Kirim Request
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
            <a href="Cek Status Request.html" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #1F2937', color: '#4B5563', padding: '14px 24px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#2A2F39'; e.currentTarget.style.color='#9CA3AF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#1F2937'; e.currentTarget.style.color='#4B5563'; }}
            >Cek Status</a>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
window.CTABanner = CTABanner;

/* ── Footer ──────────────────────────────────────────── */
const Footer = () => (
  <footer style={{ borderTop: '1px solid #0F1115', background: '#080A0E', padding: '32px 24px' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 28 }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, background: '#FFD100', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 900, color: '#0D0F14' }}>MG</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#2A2F39', letterSpacing: '-0.3px' }}>MyGameON</span>
          </div>
          <p style={{ fontSize: 11.5, color: '#1F2937', maxWidth: 260, lineHeight: 1.6 }}>Katalog game PC terlengkap. Cari, beli, dan request game favoritmu di satu tempat.</p>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 800, color: '#2A2F39', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Navigasi</h4>
            {['Katalog','Request Game','Cek Status','Blog'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: 12, color: '#1F2937', textDecoration: 'none', marginBottom: 8, fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#6B7280'}
                onMouseLeave={e => e.currentTarget.style.color='#1F2937'}
              >{l}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 800, color: '#2A2F39', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Bantuan</h4>
            {['FAQ','Tutorial Video','WhatsApp','Feedback'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: 12, color: '#1F2937', textDecoration: 'none', marginBottom: 8, fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='#6B7280'}
                onMouseLeave={e => e.currentTarget.style.color='#1F2937'}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #0F1115', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ color: '#151920', fontSize: 11 }}>© {new Date().getFullYear()} MyGameON Hub. All rights reserved.</p>
        <a href="/login" style={{ color: '#151920', fontSize: 10, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color='#374151'}
          onMouseLeave={e => e.currentTarget.style.color='#151920'}
        >Admin</a>
      </div>
    </div>
  </footer>
);
window.Footer = Footer;
