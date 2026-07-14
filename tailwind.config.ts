import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poise: {
          DEFAULT: "#111827",
          accent: "#db2777",
          light: "#fdf2f8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
