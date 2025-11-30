/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#0b0c10', // En koyu zemin
          800: '#1f2833', // Panel rengi
          500: '#66fcf1', // Neon Cyan (Accent)
          400: '#45a29e', // Sönük Accent
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}