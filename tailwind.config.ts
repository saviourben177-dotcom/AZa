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
        gold: {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          light: "rgb(var(--gold-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          light: "rgb(var(--danger-light) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
      },
      fontFamily: {
        display: [
          "var(--font-sora)",
          "Avenir Next",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-inter)",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "24px",
        "card-sm": "16px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
