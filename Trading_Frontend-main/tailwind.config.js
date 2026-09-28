/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#4CAF50',
        'sidebar-bg': '#202940',
        'main-bg': '#202940',
        'card-bg': '#202940',
        'accent-blue': '#01B4EA',
        'border-dim': '#2d3748',
        'text-dim': '#a0aec0',
      }
    },
  },
  plugins: [],
}
