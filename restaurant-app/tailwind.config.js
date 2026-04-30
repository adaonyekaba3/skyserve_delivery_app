/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
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
