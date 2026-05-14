/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/**/*.html"],
  theme: {
    extend: {
      colors: {
        surface: "#0d0d0d",
        card: "#1a1a1a",
        border: "#262626",
        accent: "#4A90E2",
        muted: "#8e8e93",
      },
    },
  },
  plugins: [],
};
