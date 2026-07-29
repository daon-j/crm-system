"use client";

import { useEffect, useState } from "react";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "시스템 설정" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
];

export default function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setChoice(saved === "light" || saved === "dark" ? saved : "system");
  }, []);

  function apply(next: ThemeChoice) {
    setChoice(next);
    if (next === "system") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  return (
    <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => apply(opt.value)}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            choice === opt.value ? "bg-surface text-primary shadow-sm" : "text-ink-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
