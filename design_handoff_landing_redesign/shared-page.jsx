/* shared-page.jsx — Shared components for sub-pages */

/* ── Page Shell (nav + wrapper) ─────────────────────── */
const PageShell = ({ title, children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0F14', color: '#F3F4F6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sticky nav */}
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #151920', background: 'rgba(13,15,20,0.92)', padding: '0 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="Landing Page v2.html" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Kembali
            </a>
            <div style={{ width: 1, height: 16, background: '#1F2937' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F3F4F6' }}>{title}</span>
          </div>
          <a href="Landing Page v2.html" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <div style={{ width: 24, height: 24, background: '#FFD100', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 900, color: '#0D0F14' }}>MG</div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#2A2F39' }}>MyGameON</span>
          </a>
        </div>
      </nav>
      {/* Content */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
        {children}
      </main>
      {/* Mini footer */}
      <footer style={{ borderTop: '1px solid #111317', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#1F2937' }}>© {new Date().getFullYear()} MyGameON Hub</p>
      </footer>
    </div>
  );
};
window.PageShell = PageShell;

/* ── Input Field ────────────────────────────────────── */
const InputField = ({ label, required, error, icon, children, hint }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#C8CFDA', marginBottom: 6 }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
    {error && <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{error}</p>}
    {hint && <p style={{ color: '#2A2F39', fontSize: 11, marginTop: 4 }}>{hint}</p>}
  </div>
);
window.InputField = InputField;

/* ── Shared input style ─────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '12px 14px', background: '#080A0E', border: '1px solid #151920',
  borderRadius: 10, color: '#F3F4F6', fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};
const inputFocus = (e) => e.target.style.borderColor = 'rgba(255,209,0,0.4)';
const inputBlur = (e) => e.target.style.borderColor = '#151920';
window.inputStyle = inputStyle;
window.inputFocus = inputFocus;
window.inputBlur = inputBlur;
