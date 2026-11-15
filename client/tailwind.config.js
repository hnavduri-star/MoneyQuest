/**
 * Matte-finish design tokens. Every colour is a CSS variable (RGB channels) defined in src/index.css,
 * with a light and a dark value, so the whole app switches theme by changing variables only.
 * Accent hues are Okabe–Ito based (colour-blind safe); state is never shown by colour alone.
 */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: v('bg'),
        surface: v('surface'),
        surface2: v('surface2'),
        ink: v('ink'),
        soft: v('soft'),
        line: v('line'),
        sky: { DEFAULT: v('sky'), light: '#56B4E9', pale: v('sky-pale') },
        sun: { DEFAULT: '#E69F00', light: '#F7C95C', pale: v('sun-pale') },
        leaf: { DEFAULT: v('leaf'), pale: v('leaf-pale') },
        berry: { DEFAULT: '#CC79A7', pale: v('berry-pale') },
        ember: { DEFAULT: v('ember'), pale: v('ember-pale') },
        theme: 'var(--theme)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { blob: '1.75rem' },
      boxShadow: {
        pop: '0 4px 0 0 rgb(var(--c-shadow) / 0.22)',
        card: '0 18px 40px -22px rgb(var(--c-shadow) / 0.55)',
      },
      maxWidth: { app: '520px' },
    },
  },
};
