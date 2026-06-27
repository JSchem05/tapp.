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
        cream: "#F5F3EF",
        paper: "#FFFFFF",
        amber: "#C8873A",
        clay: "#A06F3C",
        coffee: "#6B6560",
        muted: "#6B6560",
        line: "#E8E4DE",
        sage: "#7A8B75",
        ink: "#1A1A1A"
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
