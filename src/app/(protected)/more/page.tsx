import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

const MORE_ITEMS = [
  { href: "/calls", label: "콜 상담", icon: "📞" },
  { href: "/notes", label: "학습노트", icon: "📖" },
  { href: "/contracts", label: "계약관리", icon: "📄" },
  { href: "/settings", label: "설정", icon: "⚙️" },
] as const;

export default async function MorePage() {
  const user = await requireUser();
  const userLabel = user.name ? `${user.name} 설계사` : user.email;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-ink mb-1">더보기</h1>
      <p className="text-sm text-ink-muted mb-6">{userLabel}</p>

      <div className="rounded-xl border border-border bg-surface overflow-hidden mb-6">
        {MORE_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink-2 hover:bg-surface-muted ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <span aria-hidden className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-ink-2 hover:bg-surface-muted"
        >
          <span aria-hidden>🚪</span>
          로그아웃
        </button>
      </form>
    </div>
  );
}
