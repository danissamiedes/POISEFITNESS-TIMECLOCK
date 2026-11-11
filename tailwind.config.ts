import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent is env-driven so one codebase can serve multiple
        // companies (each Vercel project sets its own colors at build time).
        // Defaults are POISE pink.
        poise: {
          DEFAULT: "#111827",
          accent: process.env.NEXT_PUBLIC_ACCENT || "#db2777",
          accentHover: process.env.NEXT_PUBLIC_ACCENT_HOVER || "#be185d",
          light: process.env.NEXT_PUBLIC_ACCENT_LIGHT || "#fdf2f8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
