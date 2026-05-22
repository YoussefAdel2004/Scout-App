/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        scout: {
          50: '#f3f8f6',
          100: '#e2efeb',
          200: '#c5dfd7',
          300: '#9bc6b8',
          400: '#6ca796',
          500: '#4f8c7b',
          600: '#3d7061',
          700: '#335a4f',
          800: '#2c4a41',
          900: '#283f38',
          950: '#142520',
        },
      },
    },
  },
  plugins: [],
}
