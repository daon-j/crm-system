"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "카톡 복사" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
    >
      {copied ? "✅ 복사됨" : `💬 ${label}`}
    </button>
  );
}
