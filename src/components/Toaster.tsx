"use client";

import { useEffect, useState } from "react";
import type { ToastDetail } from "@/lib/toast";

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastDetail[]>([]);

  useEffect(() => {
    function handle(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      setToasts((prev) => [...prev, detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 2500);
    }
    window.addEventListener("crm-toast", handle);
    return () => window.removeEventListener("crm-toast", handle);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm text-ink-ink shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
