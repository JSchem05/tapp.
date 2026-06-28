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
        cream: "rgba(255, 255, 255, 0.45)",
        paper: "#FFFFFF",
        amber: "#4F6EF7",
        clay: "#3A57E8",
        coffee: "#6B7280",
        muted: "#6B7280",
        line: "rgba(99, 125, 255, 0.12)",
        sage: "#7A8B75",
        ink: "#0F1117"
      },
      boxShadow: {
        soft: "0 8px 32px rgba(99, 125, 255, 0.10)",
        lift: "0 12px 40px rgba(99, 125, 255, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
