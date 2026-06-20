/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#333333',
          muted: '#6b6b6b',
          faint: '#a3a3a3',
        },
        paper: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          warm: '#f5f5f5',
        },
        line: {
          DEFAULT: '#e5e5e5',
          strong: '#d4d4d4',
        },
        state: {
          success: '#15803d',
          warning: '#a16207',
          danger: '#b91c1c',
          info: '#1d4ed8',
        },
        accent: {
          DEFAULT: '#b5562f',
          hover: '#96431f',
          soft: '#f5e6df',
        },
        rating: {
          DEFAULT: '#f5b400',
          soft: '#fdf0d5',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '6px',
        lg: '8px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04)',
        hover: '0 2px 6px rgba(0,0,0,.06), 0 10px 24px rgba(0,0,0,.06)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(.2, .8, .2, 1)',
      },
      maxWidth: {
        container: '1400px',
      },
      fontSize: {
        '2xs': '10px',
        '3xs': '9px',
      },
      letterSpacing: {
        eyebrow: '0.25em',
        logo: '0.2em',
      },
    },
  },
  plugins: [],
}
