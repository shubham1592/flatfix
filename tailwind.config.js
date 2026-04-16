/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fffefb',
          100: '#fef9f4',
          200: '#fdf0e4',
          300: '#fbe5d0',
        },
        blush: {
          100: '#fde8ed',
          200: '#f9c4d2',
          300: '#f5a0b7',
          400: '#f07a9b',
          500: '#e8537e',
          600: '#d43a66',
        },
        mint: {
          100: '#e6f7f0',
          200: '#b3ebd3',
          300: '#80dfb6',
          400: '#4dd399',
          500: '#2db87a',
        },
        lavender: {
          100: '#f0ebfa',
          200: '#d9cef4',
          300: '#c2b1ee',
          400: '#ab94e8',
        },
        peach: {
          100: '#fef0e7',
          200: '#fdd5bf',
          300: '#fcba97',
          400: '#fb9f6f',
        },
        sage: {
          100: '#ecf0e8',
          200: '#d2dcc8',
          300: '#b8c8a8',
        },
        dark: {
          bg: '#1a1a2e',
          card: '#222240',
          border: '#2d2d50',
          text: '#e0dfe4',
          muted: '#9594a8',
        }
      },
      borderRadius: {
        'cute': '1rem',
        'cutest': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0,0,0,0.05)',
        'soft-md': '0 4px 20px rgba(0,0,0,0.08)',
        'soft-lg': '0 8px 30px rgba(0,0,0,0.1)',
        'glow-pink': '0 0 20px rgba(240,122,155,0.3)',
        'glow-mint': '0 0 20px rgba(77,211,153,0.3)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
