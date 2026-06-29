/**
 * Orchard Talent Group — Tailwind config
 * Sourced directly from the OTG design system export (June 2026).
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'rich-green': {
          DEFAULT: '#328269',
          700: '#25614E',
          300: '#7FB6A3',
          100: '#E2EFEA',
        },
        'dark-teal': {
          DEFAULT: '#143333',
          800: '#0D2222',
          600: '#234A4A',
        },
        'fresh-mint': {
          DEFAULT: '#A5F1D0',
          200: '#D2F8E8',
        },
        'soft-ivory': {
          DEFAULT: '#FFFAF1',
          shade: '#F4EDE0',
        },
        'warm-terracotta': {
          DEFAULT: '#E5895B',
          700: '#C46B3F',
        },
        'apricot-blush': {
          DEFAULT: '#F4C7AB',
          200: '#FAE5D6',
        },
        bg: '#FFFAF1',
        'bg-raised': '#FFFFFF',
        'bg-inverse': '#143333',
        surface: '#FFFFFF',
        'surface-inverse': '#143333',
        heading: '#143333',
        body: '#143333',
        muted: '#4A6360',
        'on-dark': '#FFFAF1',
        link: '#328269',
        'link-hover': '#25614E',
        'border-subtle': '#F4EDE0',
        'border-strong': '#D8E2DE',
      },

      fontFamily: {
        sans: [
          'Source Sans 3', 'Source Sans Pro', '-apple-system',
          'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif',
        ],
      },

      fontWeight: {
        light: '300',
        normal: '400',
        semibold: '600',
        black: '900',
      },

      fontSize: {
        xs:    ['0.75rem',  { lineHeight: '1.5' }],
        sm:    ['0.875rem', { lineHeight: '1.5' }],
        base:  ['1rem',     { lineHeight: '1.65' }],
        md:    ['1.125rem', { lineHeight: '1.5' }],
        lg:    ['1.375rem', { lineHeight: '1.25' }],
        xl:    ['1.75rem',  { lineHeight: '1.25' }],
        '2xl': ['2.25rem',  { lineHeight: '1.1' }],
        '3xl': ['3rem',     { lineHeight: '1.1' }],
      },

      letterSpacing: {
        tight:   '-0.01em',
        normal:  '0',
        wide:    '0.04em',
        eyebrow: '0.12em',
      },

      spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.5rem',
        6: '2rem',
        7: '3rem',
        8: '4rem',
        9: '6rem',
        10: '8rem',
        gutter: '1.5rem',
      },

      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '16px',
        xl:    '24px',
        pill:  '999px',
        photo: '20px',
      },

      boxShadow: {
        xs:    '0 1px 2px rgba(20, 51, 51, 0.05)',
        sm:    '0 2px 8px rgba(20, 51, 51, 0.06)',
        md:    '0 8px 24px rgba(20, 51, 51, 0.08)',
        lg:    '0 16px 48px rgba(20, 51, 51, 0.12)',
        focus: '0 0 0 3px rgba(50, 130, 105, 0.35)',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        out:      'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        fast: '150ms',
        base: '240ms',
        slow: '420ms',
      },

      maxWidth: {
        container: '1200px',
        narrow:    '760px',
      },
    },
  },
  plugins: [],
};
