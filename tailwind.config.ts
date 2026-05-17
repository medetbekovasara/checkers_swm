import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#24272b",
        panel: "#fffdf7",
        bone: "#f7f3e8",
        ember: "#c98578",
        mint: "#6f97a6",
        volt: "#d8cdf7",
        violet: "#9b83e6"
      },
      boxShadow: {
        glow: "0 12px 28px rgba(111, 151, 166, 0.12)",
        ember: "0 12px 28px rgba(201, 133, 120, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
