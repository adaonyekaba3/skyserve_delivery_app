/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
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
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semi: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      borderRadius: { md: 10, lg: 14, xl: 20 },
    },
  },
  plugins: [],
};
