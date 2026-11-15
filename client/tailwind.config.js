/** Playful, colour-blind-safe design tokens (Okabe–Ito based). State is never shown by colour alone. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8EC',
        ink: '#1E2A3A',
        soft: '#5B6B7F',
        line: '#E7DCC8',
        sky: { DEFAULT: '#0072B2', light: '#56B4E9', pale: '#DDF1FB' },
        sun: { DEFAULT: '#E69F00', light: '#F7C95C', pale: '#FFF0CC' },
        leaf: { DEFAULT: '#009E73', pale: '#D5F2E8' },
        berry: { DEFAULT: '#CC79A7', pale: '#F7E3EE' },
        ember: { DEFAULT: '#D55E00', pale: '#FBE3D2' },
        theme: 'var(--theme)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { blob: '1.75rem' },
      boxShadow: {
        pop: '0 4px 0 0 rgba(30,42,58,0.18)',
        card: '0 10px 30px -14px rgba(30,42,58,0.35), 0 2px 0 rgba(30,42,58,0.06)',
      },
      maxWidth: { app: '520px' },
    },
  },
};
