/* lp-hero.jsx — Nav, Marquee Ticker, Hero section */
const { useState, useEffect, useRef } = React;

/* ── Marquee Ticker ──────────────────────────────────── */
const MarqueeTicker = () => {
  const items = [
    { text: 'Cyberpunk 2077 Update Tersedia', tag: 'NEW' },
    { text: 'Elden Ring — 44.5 GB', tag: 'HOT' },
    { text: 'Request Game Tanpa Login', tag: 'INFO' },
    { text: 'Hogwarts Legacy — Baru Ditambahkan', tag: 'DROP' },
    { text: 'Layanan Remote Install Tersedia', tag: 'LIVE' },
    { text: 'GTA V — Paling Dicari', tag: 'TOP' },
  ];
  const row = items.map((it, i) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', paddingRight: 48 }}>
      <span style={{ background: it.tag === 'NEW' ? '#FFD100' : it.tag === 'HOT' ? '#EF4444' : it.tag === 'DROP' ? '#8B5CF6' : it.tag === 'TOP' ? '#F97316' : 'rgba(255,255,255,0.1)', color: it.tag === 'INFO' || it.tag === 'LIVE' ? '#C8CFDA' : '#0D0F14', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.8px' }}>{it.tag}</span>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: '#4B5563' }}>{it.text}</span>
    </span>
  ));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: 32, background: '#080A0E', borderBottom: '1px solid #111317', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <div className="marquee-track" style={{ display: 'flex', animation: 'marqueeScroll 30s linear infinite', whiteSpace: 'nowrap' }}>
        {row}{row}{row}
      </div>
    </div>
  );
};
window.MarqueeTicker = MarqueeTicker;

/* ── Floating Pill Nav ───────────────────────────────── */
const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 250, display: 'flex', justifyContent: 'center', padding: scrolled ? '8px 16px' : '14px 16px', transition: 'padding 0.35s ease' }}>
      <div className="nav-blur" style={{
        width: '100%', maxWidth: 880,
        background: scrolled ? 'rgba(8,10,14,0.96)' : 'rgba(8,10,14,0.55)',
        border: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: 100, padding: '8px 10px 8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.35s ease',
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#FFD100', borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900, color: '#0D0F14' }}>MG</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#F3F4F6', letterSpacing: '-0.4px' }}>MyGameON</span>
        </a>
        <div className="nav-links" style={{ display: 'flex', gap: 1 }}>
          {[['Katalog','#catalog'],['Blog','Blog.html'],['Tutorial','Tutorial Video.html'],['FAQ','FAQ.html']].map(([l,h]) => (
            <a key={l} href={h} className="nav-link-item" style={{ padding: '6px 13px', borderRadius: 100, fontSize: 12.5, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <a href="https://wa.me/6285121309829" target="_blank" rel="noopener noreferrer" className="nav-link-item" style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#6B7280', textDecoration: 'none', border: '1px solid #1F2937' }}>Hubungi</a>
          <a href="Request Game.html" className="btn-yellow" style={{ padding: '7px 16px', background: '#FFD100', color: '#0D0F14', borderRadius: 100, fontSize: 12, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Request</a>
        </div>
      </div>
    </nav>
  );
};
window.NavBar = NavBar;

/* ── Hero Section ────────────────────────────────────── */
const Hero = () => {
  const parallaxRef = useRef(null);
  useEffect(() => {
    const h = () => { if (parallaxRef.current) parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.22}px)`; };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 110, paddingBottom: 60 }}>
      {/* Parallax grain */}
      <div ref={parallaxRef} className="dot-grid" style={{ position: 'absolute', inset: '-30%', pointerEvents: 'none', willChange: 'transform' }} />
      {/* Glows */}
      <div style={{ position: 'absolute', top: '8%', left: '-5%', width: 480, height: 480, background: 'rgba(139,92,246,0.18)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', animation: 'glowFloat 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '-3%', width: 360, height: 360, background: 'rgba(255,209,0,0.12)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', animation: 'glowFloat 10s ease-in-out infinite reverse' }} />
      {/* Noise texture overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Centered hero */}
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          {/* Eyebrow badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '6px 16px 6px 8px', borderRadius: 100, marginBottom: 32 }}>
            <span style={{ background: '#8B5CF6', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 100, letterSpacing: '0.5px' }}>BARU</span>
            <span style={{ color: '#A78BFA', fontSize: 12, fontWeight: 600 }}>MyGameON Sims Launcher v10.0.1 tersedia</span>
          </div>

          {/* Headline — oversized, mixed weight */}
          <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-2.5px', color: '#F3F4F6', marginBottom: 24 }}>
            Semua Game PC<br />
            <span style={{ background: 'linear-gradient(135deg, #FFD100 0%, #F97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Satu Tempat.</span>
          </h1>

          {/* Sub */}
          <p style={{ color: '#6B7280', fontSize: 'clamp(14px, 1.3vw, 17px)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 40px' }}>
            Cari game di katalog, request yang belum tersedia, atau langsung hubungi admin. Proses cepat, transparan, tanpa ribet.
          </p>

          {/* CTA row */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 40 }}>
            <a href="#catalog" className="btn-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD100', color: '#0D0F14', padding: '14px 26px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
              Cari Game
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </a>
            <a href="Request Game.html" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA', padding: '14px 26px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; }}
            >Request Game</a>
          </div>

          {/* Stats row — social proof */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { n: '500+', l: 'Game Tersedia' },
              { n: '2.4K', l: 'Request Diproses' },
              { n: '4.9', l: 'Rating Shopee' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1F27', borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FFD100', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: '#4B5563', fontWeight: 500, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, #0D0F14)', pointerEvents: 'none' }} />
    </section>
  );
};
window.Hero = Hero;
