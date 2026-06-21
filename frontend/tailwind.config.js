/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#8B5CF6",
        background: "#F9FAFB",
        surface: "#FFFFFF",
        slate: {
          850: "#151e2e",
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 40px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
