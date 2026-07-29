"use client";

export default function CancelButton({ label = "취소" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink-2 hover:bg-surface-muted"
    >
      {label}
    </button>
  );
}
