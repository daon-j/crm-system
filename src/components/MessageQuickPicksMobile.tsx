"use client";

import { useState } from "react";
import Link from "next/link";

type QuickPick = { id: string; name: string; category: string; preview: string };

export default function MessageQuickPicksMobile({
  templates,
  categories,
}: {
  templates: QuickPick[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState("전체");
  const filtered = activeCategory === "전체" ? templates : templates.filter((t) => t.category === activeCategory);

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {["전체", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
              activeCategory === c ? "bg-primary text-primary-ink" : "bg-surface-muted text-ink-2"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-2.5 mt-3">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/messages/new?templateId=${t.id}`}
            className="block rounded-xl border border-border bg-surface p-3.5 hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm font-medium text-ink">{t.name}</span>
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">{t.category}</span>
            </div>
            <p className="rounded-lg bg-surface-muted px-2.5 py-2 text-xs leading-relaxed text-ink-2 whitespace-pre-wrap">
              {t.preview}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-muted py-4">이 카테고리에 템플릿이 없어요</p>}
      </div>
    </div>
  );
}
