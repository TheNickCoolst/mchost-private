/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          green: '#00ff00',
          red: '#ff5555',
          yellow: '#ffff55',
          blue: '#5555ff',
          purple: '#ff55ff',
          cyan: '#55ffff',
          orange: '#ffaa00',
          gray: '#aaaaaa',
          darkGray: '#555555',
          black: '#000000',
          white: '#ffffff'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
      }
    },
  },
  plugins: [],
}