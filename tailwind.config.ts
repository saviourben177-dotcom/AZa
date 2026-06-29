import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        "paper-dim": "rgb(var(--paper-dim) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        aza: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)",
          light: "rgb(var(--accent-light) / <alpha-value>)",
        },
        verified: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          light: "rgb(var(--accent-light) / <alpha-value>)",
        },
        urgent: {
          DEFAULT: "rgb(var(--urgent) / <alpha-value>)",
          light: "rgb(var(--urgent-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          light: "rgb(var(--danger-light) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        display: [
          "Avenir Next",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
