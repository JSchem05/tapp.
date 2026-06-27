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
        cream: "#F5F2ED",
        paper: "#FFFFFF",
        amber: "#C8873A",
        clay: "#A06F3C",
        coffee: "#8A8480",
        muted: "#8A8480",
        line: "#E8E3DB",
        sage: "#7A8B75",
        ink: "#1A1A1A"
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0, 0, 0, 0.07)",
        lift: "0 4px 24px rgba(0, 0, 0, 0.11)"
      }
    }
  },
  plugins: []
};

export default config;
