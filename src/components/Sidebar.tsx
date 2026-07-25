"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "🏠" },
  { href: "/customers", label: "고객관리", icon: "👥" },
  { href: "/calls", label: "콜 상담", icon: "📞" },
  { href: "/messages", label: "문자함", icon: "✉️" },
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/notes", label: "학습노트", icon: "📖" },
  { href: "/contracts", label: "계약관리", icon: "📄" },
  { href: "/settings", label: "설정", icon: "⚙️" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-slate-200">
        <span className="font-bold text-lg text-slate-900">보험CRM</span>
      </div>
      <nav className="flex-1 py-3">
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
    </aside>
  );
}
