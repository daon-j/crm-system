"use client";

import { useMemo, useRef, useState } from "react";
import { previewFill, sortCategories, TEMPLATE_CATEGORY_ORDER } from "@/lib/messageTemplate";

type TemplateOption = { id: string; name: string; category: string; body: string };

export default function TemplatePickerDialog({
  templates,
  agent,
  customerName,
  selectedId,
  onSelect,
}: {
  templates: TemplateOption[];
  agent: { 설계사명: string; 설계사전화번호: string; 설계사내선번호: string };
  customerName?: string | null;
  selectedId: string;
  onSelect: (templateId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("전체");

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const categories = useMemo(() => ["전체", ...sortCategories([...new Set(templates.map((t) => t.category))])], [templates]);

  const filtered = templates
    .filter((t) => {
      if (activeCategory !== "전체" && t.category !== activeCategory) return false;
      if (query.trim() && !t.name.includes(query.trim()) && !t.body.includes(query.trim())) return false;
      return true;
    })
    .sort((a, b) => {
      // "전체" 탭에서도 방문확정/부재중 등 우선순위 카테고리가 먼저 보이도록 정렬
      const ia = TEMPLATE_CATEGORY_ORDER.indexOf(a.category);
      const ib = TEMPLATE_CATEGORY_ORDER.indexOf(b.category);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  function pick(id: string) {
    onSelect(id);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border px-3.5 py-2.5 text-left hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="min-w-0">
          {selected ? (
            <>
              <div className="text-sm font-medium text-ink truncate">{selected.name}</div>
              <div className="text-xs text-ink-muted">{selected.category} · 눌러서 다른 템플릿 둘러보기</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-ink-2">직접 작성 (템플릿 없음)</div>
              <div className="text-xs text-ink-muted">눌러서 템플릿 둘러보기</div>
            </>
          )}
        </div>
        <span className="text-ink-muted flex-shrink-0">›</span>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-xl border border-border bg-surface p-0 h-[85vh] max-h-[85vh] backdrop:bg-black/30"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="닫기"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-ink-2 hover:bg-border"
            >
              ←
            </button>
            <h3 className="text-base font-bold text-ink">템플릿 둘러보기</h3>
          </div>

          <div className="px-4 pt-3 flex-shrink-0 space-y-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 템플릿 이름으로 검색"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    activeCategory === c ? "bg-primary text-primary-ink" : "bg-surface-muted text-ink-2"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <button
              type="button"
              onClick={() => pick("")}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium ${
                selectedId === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-ink-2 hover:bg-surface-muted"
              }`}
            >
              직접 작성 (템플릿 없음)
            </button>
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left ${
                  selectedId === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-surface-muted"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-semibold text-ink">{t.name}</span>
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">{t.category}</span>
                </div>
                <p className="rounded-lg bg-surface-muted px-2.5 py-2 text-xs leading-relaxed text-ink-2 whitespace-pre-wrap">
                  {previewFill(t.body, agent, customerName || undefined)}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-6">조건에 맞는 템플릿이 없어요</p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
