import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B1C2C', soft: '#E6ECF1', hover: '#0A1825' },
        accent: { DEFAULT: '#C6A052', soft: '#F4EBD6' },
        bg: '#F8F5F0',
        cream: '#F8F5F0',
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
        card: '0 1px 2px rgba(11, 28, 44, 0.04), 0 4px 12px rgba(11, 28, 44, 0.05)',
        navy: '0 8px 24px rgba(11, 28, 44, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
