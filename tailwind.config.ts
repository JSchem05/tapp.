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
        cream: "#F8F8F8",
        paper: "#FFFFFF",
        amber: "#111111",
        clay: "#333333",
        coffee: "#666666",
        muted: "#666666",
        line: "#EEEEEE",
        sage: "#16A34A",
        ink: "#111111"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        lift: "0 4px 20px rgba(0,0,0,0.10)"
      }
    }
  },
  plugins: []
};

export default config;
