/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#0f172a',
          800: '#1e293b',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        purple: {
          500: '#a855f7',
          600: '#9333ea',
          900: '#581c87',
        },
        indigo: {
          500: '#6366f1',
        },
      },
      gridTemplateColumns: {
        '18': 'repeat(18, minmax(0, 1fr))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }, // Adjust -10px for more/less float
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite', // Adjust 3s for speed
      }
    },
  },
  plugins: [],
};