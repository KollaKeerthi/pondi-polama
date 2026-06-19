import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FAF3E7",
        card: "#FFFFFF",
        primary: "#12355B",
        secondary: "#2F6F73",
        accent: "#D97745",
        highlight: "#C75B7A",
        muted: "#E8DED1",
        text: "#1F2933",
        mutedText: "#6B7280",
        border: "#E5D6C8"
      },
      boxShadow: {
        coastal: "0 18px 60px rgba(18, 53, 91, 0.12)",
        ticket: "0 10px 30px rgba(47, 111, 115, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
