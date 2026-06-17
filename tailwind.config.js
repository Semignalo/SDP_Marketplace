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
          DEFAULT: '#2a2520',
          soft: '#4a4038',
          muted: '#6b6058',
          faint: '#a39a8e',
        },
        paper: {
          DEFAULT: '#faf7f2',
          soft: '#f3eee6',
          warm: '#ece4d6',
        },
        line: {
          DEFAULT: '#e5ddd0',
          strong: '#d6cbb8',
        },
        state: {
          success: '#15803d',
          warning: '#a16207',
          danger: '#b91c1c',
          info: '#1d4ed8',
        },
        accent: {
          DEFAULT: '#c1623d',
          hover: '#a14e30',
          soft: '#f5e8e0',
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
    },
  },
  plugins: [],
}
