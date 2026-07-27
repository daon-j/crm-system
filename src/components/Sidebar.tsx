"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/customers", label: "고객관리", icon: "👥" },
  { href: "/calls", label: "콜 상담", icon: "📞" },
  { href: "/messages", label: "문자함", icon: "✉️" },
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/notes", label: "학습노트", icon: "📖" },
  { href: "/contracts", label: "계약관리", icon: "📄" },
  { href: "/settings", label: "설정", icon: "⚙️" },
] as const;

export default function Sidebar({
  userName,
  userEmail,
}: {
  userName: string | null;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const userLabel = userName ? `${userName} 설계사` : userEmail;

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/" className="font-bold text-lg text-slate-900">
          보험CRM
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <Link href="/" onClick={() => setOpen(false)} className="font-bold text-lg text-slate-900">
            보험CRM
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="flex flex-col gap-0.5 px-3">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-2 py-1 text-xs text-slate-400">{userLabel}</p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <span aria-hidden>🚪</span>
              로그아웃
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
