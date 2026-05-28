export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0D0F14',
        'bg-secondary': '#080A0E',
        'bg-surface': '#111317',
        'border-default': '#151920',
        'border-subtle': '#1A1F27',
        'border-muted': '#1F2937',
        'text-primary': '#F3F4F6',
        'text-secondary': '#E5E7EB',
        'text-muted': '#C8CFDA',
        'text-tertiary': '#6B7280',
        'text-dim': '#4B5563',
        'text-faint': '#374151',
        'text-ghost': '#2A2F39',
        'text-hidden': '#1F2937',
        'accent-yellow': '#FFD100',
        'accent-purple': '#8B5CF6',
        'accent-purple-light': '#A78BFA',
        'accent-orange': '#F97316',
        'accent-red': '#EF4444',
        'accent-green': '#22C55E',
        'accent-green-dark': '#15803D',
        'accent-cyan': '#22D3EE',
        'accent-emerald': '#10B981',
        'shopee-orange': '#EE4D2D',
      },
      animation: {
        'marquee-scroll': 'marqueeScroll 30s linear infinite',
        'glow-float': 'glowFloat 8s ease-in-out infinite',
        'glow-float-slow': 'glowFloat 10s ease-in-out infinite reverse',
        'hero-in': 'heroIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in': 'slideIn 0.5s ease forwards',
      },
      keyframes: {
        marqueeScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        glowFloat: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1) translateY(0)' },
          '50%': { opacity: '0.8', transform: 'scale(1.06) translateY(-12px)' },
        },
        heroIn: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
