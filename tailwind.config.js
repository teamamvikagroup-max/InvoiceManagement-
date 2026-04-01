/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f8ff",
          100: "#eef2ff",
          200: "#dbe4ff",
          300: "#bacdff",
          400: "#89a8ff",
          500: "#5f7cff",
          600: "#445af5",
          700: "#3344d7",
          800: "#2d3ab0",
          900: "#29348b"
        }
      },
      boxShadow: {
        glow: "0 20px 60px rgba(68, 90, 245, 0.18)"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [],
};
