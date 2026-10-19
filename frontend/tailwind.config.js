/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#E8403A',
        'ink-black': '#141414',
        'off-white': '#F7F4EF',
        'beige': '#EFEAE2',
        'card-white': '#FFFFFF',
        'muted-text': '#6B6B6B',
        'status-active': '#3b82f6', // blue
        'status-matched': '#f59e0b', // amber
        'status-claimed': '#10b981', // green
        'status-closed': '#6b7280', // grey
      },
      fontFamily: {
        'oswald': ['Oswald', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}
