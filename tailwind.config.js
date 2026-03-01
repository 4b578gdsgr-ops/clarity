/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        lm: {
          bg: '#faf9f6',
          card: '#ffffff',
          border: '#e5e0d8',
          green: '#2d8653',
          greenlight: '#4a9e6b',
          warm: '#d97706',
          heart: '#f472b6',
          forest: '#1a6e3f',
          muted: '#636e72',
          heading: '#2d3436',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
};
