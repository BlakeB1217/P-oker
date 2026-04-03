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
        brand: {
          ink: '#0a0f1a',
          accent: '#34d399',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(52, 211, 153, 0.25)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
