/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // BioVibe marka paleti — ana tonlar: #2d0a50 (900), #5b2786 (600), #e6c7ff (200)
        brand: {
          50: '#faf4ff',
          100: '#f3e6ff',
          200: '#e6c7ff',
          300: '#d1a6f2',
          400: '#a876d4',
          500: '#7d45ad',
          600: '#5b2786',
          700: '#4a1d70',
          800: '#3a1460',
          900: '#2d0a50',
          950: '#1c0534',
        },
      },
      fontFamily: {
        sans: ['Raleway', ...defaultTheme.fontFamily.sans],
        display: ['Prata', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
}
