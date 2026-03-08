/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        jimsBlue: '#1f4b9c',
        jimsBlueDark: '#173d82',
        jimsGold: '#daa824',
        jimsSoft: '#edf2ff',
      },
      boxShadow: {
        glow: '0 20px 45px rgba(31, 75, 156, 0.24)',
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        drift: 'drift 16s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(18px)' },
          '100%': { transform: 'translateX(0px)' },
        },
      },
    },
  },
  plugins: [],
}
