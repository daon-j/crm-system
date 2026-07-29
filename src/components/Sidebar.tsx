"use client";

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
  const userLabel = userName ? `${userName} 설계사` : userEmail;

  return (
    <>
      {/* 모바일 상단바 - 네비게이션은 하단 탭바(MobileTabBar)가 담당 */}
      <div className="flex h-14 items-center border-b border-border bg-surface px-4 lg:hidden">
        <Link href="/" className="font-bold text-lg text-ink">
          보험CRM
        </Link>
      </div>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface lg:static lg:flex">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/" className="font-bold text-lg text-ink">
            보험CRM
          </Link>
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
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-ink-2 hover:bg-surface-muted hover:text-ink"
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
        <div className="border-t border-border p-3">
          <p className="truncate px-2 py-1 text-xs text-ink-muted">{userLabel}</p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface-muted hover:text-ink"
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
