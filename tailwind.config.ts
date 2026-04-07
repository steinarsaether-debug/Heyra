import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#1B4332",
        amber: "#D97706",
        stone: "#78716C",
        parchment: "#FAFAF9",
      },
      boxShadow: {
        glow: "0 24px 80px -32px rgba(27, 67, 50, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
