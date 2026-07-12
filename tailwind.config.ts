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
        info: "rgb(var(--color-info) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        divider: "rgb(var(--divider) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--text-tertiary) / <alpha-value>)",
        tag: {
          purple: "rgb(var(--tag-purple-fg) / <alpha-value>)",
          "purple-bg": "rgb(var(--tag-purple-bg) / <alpha-value>)",
          blue: "rgb(var(--tag-blue-fg) / <alpha-value>)",
          "blue-bg": "rgb(var(--tag-blue-bg) / <alpha-value>)",
          teal: "rgb(var(--tag-teal-fg) / <alpha-value>)",
          "teal-bg": "rgb(var(--tag-teal-bg) / <alpha-value>)",
          orange: "rgb(var(--tag-orange-fg) / <alpha-value>)",
          "orange-bg": "rgb(var(--tag-orange-bg) / <alpha-value>)",
          pink: "rgb(var(--tag-pink-fg) / <alpha-value>)",
          "pink-bg": "rgb(var(--tag-pink-bg) / <alpha-value>)",
        },
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
        card: "16px",
        "card-sm": "10px",
        lg: "20px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
