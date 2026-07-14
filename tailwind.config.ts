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
          accent: "#6d28d9",
          light: "#f5f3ff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
