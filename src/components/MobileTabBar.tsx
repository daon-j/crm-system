"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/customers", label: "고객", icon: "👥" },
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/messages", label: "문자함", icon: "✉️" },
  { href: "/more", label: "더보기", icon: "☰" },
] as const;

const QUICK_ACTIONS = [
  { href: "/calendar/new", label: "일정 등록", icon: "📅" },
  { href: "/calls", label: "콜 상담 기록", icon: "📞" },
  { href: "/messages/new", label: "문자 발송", icon: "💬" },
  { href: "/notes", label: "학습노트 작성", icon: "📖" },
] as const;

export default function MobileTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-16 z-50 mx-3 rounded-2xl border border-border bg-surface p-2 shadow-lg lg:hidden">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-ink-2 hover:bg-surface-muted"
            >
              <span aria-hidden className="text-lg">
                {a.icon}
              </span>
              {a.label}
            </Link>
          ))}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 h-16 border-t border-border bg-surface lg:hidden">
        <div className="relative flex h-full items-center justify-around">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="빠른 등록"
            aria-expanded={open}
            className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-ink shadow-lg shadow-accent/40"
          >
            {open ? "✕" : "＋"}
          </button>
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-primary" : "text-ink-muted"
                }`}
              >
                <span aria-hidden className="text-lg">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
