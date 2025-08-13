/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'neu-bg': '#f0f0f3',
        'neu-shadow-dark': '#d1d1d4',
        'neu-shadow-light': '#ffffff',
      },
      boxShadow: {
        'neu': '20px 20px 60px #d1d1d4, -20px -20px 60px #ffffff',
        'neu-inset': 'inset 5px 5px 10px #d1d1d4, inset -5px -5px 10px #ffffff',
        'neu-btn': '5px 5px 10px #d1d1d4, -5px -5px 10px #ffffff',
        'neu-btn-hover': '3px 3px 6px #d1d1d4, -3px -3px 6px #ffffff',
        'neu-btn-active': 'inset 5px 5px 10px #d1d1d4, inset -5px -5px 10px #ffffff',
      }
    },
  },
  plugins: [],
}
