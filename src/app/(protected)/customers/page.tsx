import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPhone, GRADE_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; batch?: string }>;
}) {
  const user = await requireUser();
  const { q, batch } = await searchParams;
  const query = q?.trim() ?? "";
  const batchId = batch?.trim() ?? "";
  const now = new Date();

  const [customers, batches] = await Promise.all([
    prisma.customer.findMany({
      where: {
        AND: [
          { userId: user.id },
          batchId ? { batchId } : {},
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { phone: { contains: query } },
                  { memo: { contains: query } },
                ],
              }
            : {},
        ],
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            consultations: true,
            contracts: { where: { source: "AGENT_SALE" } },
            events: { where: { type: "VISIT", startAt: { lte: now } } },
          },
        },
        batch: true,
      },
    }),
    prisma.customerBatch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { customers: true } } },
    }),
  ]);

  const notContactedCount = customers.filter((c) => c._count.consultations === 0).length;
  const consentedCount = customers.filter((c) => c.mobileConsent).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">고객관리</h1>
          <p className="text-sm text-ink-muted mt-1">
            총 {customers.length}명의 고객 · 모바일동의{" "}
            <span className={consentedCount < customers.length ? "font-semibold text-danger" : "text-ink-muted"}>
              {consentedCount}/{customers.length}명
            </span>
            {batchId && ` · 콜 시도 ${customers.length - notContactedCount}명 · 미콜 ${notContactedCount}명`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/customers/import"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-muted"
          >
            엑셀로 일괄등록
          </Link>
          <Link
            href="/customers/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            + 신규 고객 등록
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <Link
          href={query ? `/customers?q=${encodeURIComponent(query)}` : "/customers"}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
            !batchId ? "bg-ink text-ink-ink" : "bg-surface-muted text-ink-2 hover:bg-border/40"
          }`}
        >
          전체
        </Link>
        {batches.map((b) => {
          const href = query
            ? `/customers?batch=${b.id}&q=${encodeURIComponent(query)}`
            : `/customers?batch=${b.id}`;
          return (
            <Link
              key={b.id}
              href={href}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                batchId === b.id ? "bg-ink text-ink-ink" : "bg-surface-muted text-ink-2 hover:bg-border/40"
              }`}
            >
              {b.name} ({b._count.customers})
            </Link>
          );
        })}
      </div>

      <form method="GET" className="mb-5">
        {batchId && <input type="hidden" name="batch" value={batchId} />}
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="이름, 전화번호, 메모로 검색"
          className="w-full max-w-md rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      <div className="lg:hidden space-y-2">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className={`block rounded-xl border border-border bg-surface p-3.5 hover:bg-surface-muted ${
              c.mobileConsent ? "" : "border-l-[3px] border-l-danger"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate font-semibold text-ink">{c.name}</span>
                <span className="shrink-0 text-xs font-medium text-accent">{c.grade}등급</span>
              </div>
              {!c.mobileConsent && (
                <span className="shrink-0 rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
                  모바일 미동의
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
              <span>{formatPhone(c.phone)}</span>
              {c.batch && <span>{c.batch.name}</span>}
              {c.job && <span>{c.job}</span>}
              <span>상담 {c._count.consultations}건</span>
            </div>
            {(c._count.events > 0 || c._count.contracts > 0 || c.referredById) && (
              <p className="mt-1.5 text-xs text-ink-muted">
                {[
                  c._count.events > 0 ? `방문${c._count.events}차` : null,
                  c._count.contracts > 0 ? "체결" : null,
                  c.referredById ? "소개" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </Link>
        ))}
        {customers.length === 0 && (
          <p className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
            {query ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
          </p>
        )}
      </div>

      <div className="hidden lg:block rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-ink-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">등급</th>
              <th className="px-4 py-3 font-medium">배치</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">모바일동의</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">직업</th>
              <th className="px-4 py-3 font-medium">상담이력</th>
              <th className="px-4 py-3 font-medium">생년월일</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.id}
                className="border-t border-border hover:bg-surface-muted"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/customers/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-accent font-medium">{c.grade}등급</td>
                <td className="px-4 py-3 text-ink-2">{c.batch?.name ?? "-"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {[
                    c._count.events > 0 ? `방문${c._count.events}차` : null,
                    c._count.contracts > 0 ? "체결" : null,
                    c.referredById ? "소개" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </td>
                <td className="px-4 py-3">
                  {c.mobileConsent ? (
                    <span className="text-ink-muted">동의</span>
                  ) : (
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
                      미동의
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-2">{formatPhone(c.phone)}</td>
                <td className="px-4 py-3 text-ink-2">{c.job ?? "-"}</td>
                <td className="px-4 py-3 text-ink-2">
                  {c._count.consultations}건
                </td>
                <td className="px-4 py-3 text-ink-2">
                  {formatDate(c.birthDate)}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-ink-muted">
                  {query ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        등급 기준: {GRADE_LABEL.A} · {GRADE_LABEL.B} · {GRADE_LABEL.C}
      </p>
    </div>
  );
}
