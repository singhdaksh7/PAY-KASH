/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0f1a",
          800: "#0d1525",
          700: "#0f1a2e",
          600: "#1a2235",
          500: "#243049",
        },
        accent: {
          green: "#00F5A0",
          blue: "#00D9F5",
          red: "#ff6b81",
          yellow: "#f8b500",
          purple: "#a29bfe",
        },
        muted: "#8892a4",
      },
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "float": "float 20s ease-in-out infinite",
        "slide-down": "slideDown 0.3s ease",
        "fade-in": "fadeIn 0.3s ease",
        "scale-in": "scaleIn 0.2s ease",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        slideDown: {
          from: { transform: "translateY(-20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
