/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF', // Blue 800
        secondary: '#3B82F6', // Blue 500
        accent: '#FBBF24', // Amber 400
        background: '#F9FAFB', // Gray 50
        text: '#1F2937', // Gray 800
      },
    },
  },
  plugins: [],
};


