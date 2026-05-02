/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        gestdoc: {
          "primary": "#2563EB",
          "primary-content": "#ffffff",
          "secondary": "#1D4ED8",
          "accent": "#F59E0B",
          "neutral": "#374151",
          "base-100": "#ffffff",
          "base-200": "#F9FAFB",
          "base-300": "#F3F4F6",
          "info": "#3B82F6",
          "success": "#22C55E",
          "warning": "#F59E0B",
          "error": "#EF4444",
        },
      },
      "light",
    ],
    defaultTheme: "gestdoc",
  },
}