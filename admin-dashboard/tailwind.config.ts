import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E3A8A', soft: '#EEF2FB', hover: '#1B3375' },
        accent: { DEFAULT: '#D4AF37', soft: '#FBF6E5' },
        bg: '#F9FAFB',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        hairline: '#F1F5F9',
        text: '#0F172A',
        muted: '#64748B',
        subtle: '#94A3B8',
        success: { DEFAULT: '#16A34A', soft: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', soft: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { md: '10px', lg: '14px', xl: '20px' },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
