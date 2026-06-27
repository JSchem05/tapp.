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
        cream: "#F7F1E8",
        paper: "#FFFDF8",
        clay: "#9E6F4E",
        coffee: "#49372A",
        sage: "#7A8B75",
        ink: "#201C18"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(73, 55, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
