import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          "50": "#e8f7f7",
          "100": "#c5eaeb",
          "200": "#8dd5d7",
          "300": "#55bfc2",
          "400": "#2daaae",
          "500": "#14a1a8",
          "600": "#0d7377",
          "700": "#0a5a5d",
          "800": "#084244",
          "900": "#052a2b",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
