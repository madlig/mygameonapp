// src/features/landing/LinkBioPage.jsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, MessageCircle, ShoppingBag, Download, BookOpen } from 'lucide-react';
import { trackCustomEvent } from '../../utils/metaPixel';

const LINKS = [
  {
    id: 'website',
    icon: Globe,
    label: 'Website MyGameON',
    href: 'https://mygameon.store',
    external: true,
    destination: 'website',
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    label: 'Chat WhatsApp',
    href: 'https://wa.me/6285121309829?text=Halo%20MyGameON%2C%20saya%20ingin%20tanya%20info%20lebih%20lanjut',
    external: true,
    destination: 'whatsapp',
  },
  {
    id: 'shopee',
    icon: ShoppingBag,
    label: 'Shopee MyGameON',
    href: 'https://shopee.co.id/mygameon',
    external: true,
    destination: 'shopee',
  },
  {
    id: 'download',
    icon: Download,
    label: 'Download',
    href: '/downloads',
    external: false,
    destination: 'download',
  },
  {
    id: 'blog',
    icon: BookOpen,
    label: 'Blog',
    href: '/blog',
    external: false,
    destination: 'blog',
  },
];

const baseButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  width: '100%',
  padding: '16px 20px',
  backgroundColor: '#2C2640',
  color: '#EDE8F5',
  borderRadius: '14px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  transition: 'background-color 0.18s ease, transform 0.1s ease, box-shadow 0.18s ease',
  boxSizing: 'border-box',
};

function LinkButton({ id, icon: Icon, label, href, external, destination }) {
  const handleClick = () => trackCustomEvent('LinkBioClick', { destination });

  const hoverHandlers = {
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = '#3E3655';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,197,24,0.10)';
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = '#2C2640';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseDown: (e) => {
      e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: (e) => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onTouchStart: (e) => {
      e.currentTarget.style.backgroundColor = '#3E3655';
      e.currentTarget.style.transform = 'scale(0.97)';
    },
    onTouchEnd: (e) => {
      e.currentTarget.style.backgroundColor = '#2C2640';
      e.currentTarget.style.transform = 'scale(1)';
    },
  };

  const inner = (
    <>
      <span style={{ color: '#F5C518', flexShrink: 0, display: 'flex' }}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={baseButtonStyle}
        onClick={handleClick}
        {...hoverHandlers}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      to={href}
      style={baseButtonStyle}
      onClick={handleClick}
      {...hoverHandlers}
    >
      {inner}
    </Link>
  );
}

const LinkBioPage = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'MyGameON — Links';

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (created) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute('content');
    meta.setAttribute(
      'content',
      'Temukan semua link resmi MyGameON — website, WhatsApp, Shopee, download software, dan blog gaming PC terlengkap.'
    );

    return () => {
      document.title = prevTitle;
      if (created) {
        meta.remove();
      } else {
        meta.setAttribute('content', prevContent || '');
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1E1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 16px 32px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Logo + tagline */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img
            src="/logo.png"
            alt="MyGameON"
            style={{ height: '60px', margin: '0 auto 14px', display: 'block' }}
          />
          <p style={{ color: '#9B8FB8', fontSize: '14px', margin: 0, letterSpacing: '0.01em' }}>
            Solusi lengkap gaming PC kamu
          </p>
        </div>

        {/* Link buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' }}>
          {LINKS.map((link) => (
            <LinkButton key={link.id} {...link} />
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            color: '#9B8FB8',
            fontSize: '12px',
            margin: 0,
            marginTop: 'auto',
          }}
        >
          © 2026 MyGameON
        </p>
      </div>
    </div>
  );
};

export default LinkBioPage;
