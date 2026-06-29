import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F3EE",
        paper: "#FFFFFF",
        amber: "#2563EB",
        blue: "#2563EB",
        blueDark: "#1D4ED8",
        clay: "#1D4ED8",
        coffee: "#6B7280",
        muted: "#6B7280",
        faint: "#9CA3AF",
        line: "#E5E7EB",
        sage: "#059669",
        greenSoft: "#ECFDF5",
        red: "#DC2626",
        redSoft: "#FEF2F2",
        warning: "#D97706",
        ink: "#0F1729",
        inkSoft: "#1C2435",
        blueSoft: "#EEF3FF"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,23,41,0.06)",
        lift: "0 4px 20px rgba(15,23,41,0.12)"
      }
    }
  },
  plugins: []
};

export default config;
