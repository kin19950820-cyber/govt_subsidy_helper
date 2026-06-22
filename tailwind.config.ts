import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0d6e6e",
          light: "#13a3a3",
          dark: "#0a5454",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "PingFang HK",
          "Microsoft JhengHei",
          "Noto Sans TC",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
