"use client";

import { useState } from "react";

export default function CategoryChips({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[];
  defaultValue: string;
}) {
  const [chips, setChips] = useState<string[]>(() =>
    options.includes(defaultValue) ? options : [defaultValue, ...options],
  );
  const [selected, setSelected] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  function addChip() {
    const value = newValue.trim();
    if (!value) return;
    setChips((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSelected(value);
    setNewValue("");
    setAdding(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelected(c)}
            className={`rounded-lg border px-3 py-1 text-sm ${
              selected === c
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-surface-muted text-ink-2 hover:bg-surface-muted"
            }`}
          >
            {c}
          </button>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg border border-dashed border-border px-3 py-1 text-sm text-ink-muted hover:border-ink-muted"
          >
            + 새 구분
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChip();
              }
            }}
            placeholder="예) 본사교육"
            className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addChip}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-ink-ink hover:opacity-90"
          >
            추가
          </button>
        </div>
      )}
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}
