/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './src/**/*.{js,ts,jsx,tsx,html}',
    './components/**/*.{js,ts,jsx,tsx,html}',
    './contexts/**/*.{js,ts,jsx,tsx,html}',
    './pages/**/*.{js,ts,jsx,tsx,html}',
    './analytics/**/*.{js,ts,jsx,tsx,html}',
    './utils/**/*.{js,ts,jsx,tsx,html}',
    './admin/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        carouselScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        scroll: 'scroll 40s linear infinite',
        'carousel-scroll': 'carouselScroll 40s linear infinite',
      },
    },
  },
  plugins: [],
};
