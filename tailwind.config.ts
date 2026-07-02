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
        cream: "#F7F6F3",
        paper: "#FFFFFF",
        amber: "#2358E6",
        blue: "#2358E6",
        blueDark: "#1B46C2",
        clay: "#1B46C2",
        coffee: "#5D6673",
        muted: "#5D6673",
        faint: "#98A1B2",
        line: "#E9E7E2",
        sage: "#0A8A5F",
        greenSoft: "#EBF9F2",
        red: "#DC2626",
        redSoft: "#FEF2F2",
        warning: "#D97706",
        ink: "#101623",
        inkSoft: "#1C2435",
        blueSoft: "#EEF2FE"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,22,35,0.04), 0 4px 16px rgba(16,22,35,0.05)",
        lift: "0 2px 6px rgba(16,22,35,0.06), 0 12px 32px rgba(16,22,35,0.10)",
        bar: "0 -1px 2px rgba(16,22,35,0.03), 0 -8px 24px rgba(16,22,35,0.06)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
