/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'] },
      colors: {
        brand: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c' },
        orange: { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c' },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        nav: '0 -4px 24px rgba(0,0,0,0.06)',
        orange: '0 4px 20px rgba(249,115,22,0.35)',
      },
    },
  },
  plugins: [],
};
