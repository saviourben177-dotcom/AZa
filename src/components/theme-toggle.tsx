"use client";

import { useState, useEffect } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme/cookie";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-card border border-line bg-surface px-4 py-3.5 text-left"
    >
      <span className="text-[14px] font-semibold text-ink">Dark mode</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          theme === "dark" ? "bg-aza" : "bg-paper-dim"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            theme === "dark" ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
