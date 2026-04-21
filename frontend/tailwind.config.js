/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        titanes: {
          dark: "#0b1b4a",
          navy: "#132a7a",
          red: "#d32f2f",
          crimson: "#b71c1c",
          ice: "#e8f1ff",
          steel: "#1f2937",
        },
      },
      fontFamily: {
        display: ["'Oswald'", "'Bebas Neue'", "Impact", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
