"use client";

import { useState, type ReactNode } from "react";

export default function CalendarViewToggle({ grid, list }: { grid: ReactNode; list: ReactNode }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="mb-2 flex gap-0.5 rounded-lg bg-surface-muted p-0.5">
        <button
          type="button"
          onClick={() => setView("grid")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold ${
            view === "grid" ? "bg-surface text-primary shadow-sm" : "text-ink-muted"
          }`}
        >
          격자형
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold ${
            view === "list" ? "bg-surface text-primary shadow-sm" : "text-ink-muted"
          }`}
        >
          목록형
        </button>
      </div>
      <div className={view === "grid" ? "" : "hidden"}>{grid}</div>
      <div className={view === "list" ? "" : "hidden"}>{list}</div>
    </div>
  );
}
