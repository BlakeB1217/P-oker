/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: '#0d5c2e',
        feltDark: '#084422',
        chip: '#c9a227',
        card: '#f8f6f0',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
