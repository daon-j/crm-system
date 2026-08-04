import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export default async function MessageHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { month } = await searchParams;

  const allSent = await prisma.message.findMany({
    where: { userId: user.id, status: "SENT" },
    orderBy: { sentAt: "desc" },
    include: { customer: true },
  });

  const monthOptions = Array.from(
    new Set(
      allSent
        .filter((m) => m.sentAt)
        .map((m) => {
          const d = m.sentAt as Date;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }),
    ),
  ).sort((a, b) => (a < b ? 1 : -1));

  const filtered = month
    ? allSent.filter((m) => {
        if (!m.sentAt) return false;
        const d = m.sentAt as Date;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === month;
      })
    : allSent;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">발송이력 전체보기</h1>
        <Link href="/messages" className="text-sm text-ink-muted hover:underline">
          ← 문자함으로
        </Link>
      </div>
      <p className="text-sm text-ink-muted mb-6">
        발송완료 기록은 삭제되지 않고 계속 보관됩니다. 월별로 조회할 수 있어요.
      </p>

      <form className="flex items-end gap-2 mb-6">
        <div>
          <label className="block text-xs text-ink-muted mb-1">조회 월</label>
          <select
            name="month"
            defaultValue={month ?? ""}
            className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">전체 ({allSent.length}건)</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ink-ink hover:opacity-90"
        >
          조회
        </button>
      </form>

      <p className="text-sm text-ink-muted mb-3">{filtered.length}건</p>
      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-surface-muted px-3.5 py-2.5 text-sm">
            <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
              <span className="font-medium text-ink-2">{m.customer.name}</span>
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-ink-muted">{m.triggerType}</span>
              <span>{formatDateTime(m.sentAt)} 발송</span>
            </div>
            <p className="text-ink-2">{m.content}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-muted">해당 기간 발송이력이 없습니다</p>}
      </div>
    </div>
  );
}
