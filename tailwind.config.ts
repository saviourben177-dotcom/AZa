import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          soft: "var(--primary-soft)",
          strong: "var(--primary-strong)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        urgent: {
          DEFAULT: "var(--urgent)",
          soft: "var(--urgent-soft)",
          light: "rgb(var(--urgent-light) / <alpha-value>)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        // Backwards-compatible tokens from AZa
        ink: "rgb(var(--ink) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        "paper-dim": "rgb(var(--paper-dim) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        aza: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-strong)",
          light: "var(--primary-soft)",
        },
        verified: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-soft)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          light: "rgb(var(--gold-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "var(--destructive)",
          light: "rgb(var(--danger-light) / <alpha-value>)",
        },
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        divider: "var(--border)",
        "text-secondary": "var(--muted-foreground)",
        "text-tertiary": "var(--muted-foreground)",
      },
      fontFamily: {
        display: [
          "var(--font-sora)",
          "Sora",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        sans: [
          "var(--font-manrope)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-manrope)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        card: "16px",
        "card-sm": "10px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
export default config;
