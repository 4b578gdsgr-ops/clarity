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
          bg: '#0f1a14',
          card: '#0d1f15',
          border: '#1a3328',
          green: '#4ade80',
          warm: '#f59e0b',
          heart: '#f472b6',
          forest: '#166534',
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
