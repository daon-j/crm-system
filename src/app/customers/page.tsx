import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPhone, GRADE_LABEL } from "@/lib/format";

const GRADE_BADGE: Record<string, string> = {
  A: "bg-amber-100 text-amber-800",
  B: "bg-blue-100 text-blue-700",
  C: "bg-slate-100 text-slate-600",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; batch?: string }>;
}) {
  const { q, batch } = await searchParams;
  const query = q?.trim() ?? "";
  const batchId = batch?.trim() ?? "";
  const now = new Date();

  const [customers, batches] = await Promise.all([
    prisma.customer.findMany({
      where: {
        AND: [
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
          <h1 className="text-2xl font-bold text-slate-900">고객관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            총 {customers.length}명의 고객 · 모바일동의{" "}
            <span className={consentedCount < customers.length ? "font-semibold text-red-600" : "text-slate-500"}>
              {consentedCount}/{customers.length}명
            </span>
            {batchId && ` · 콜 시도 ${customers.length - notContactedCount}명 · 미콜 ${notContactedCount}명`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/customers/import"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            엑셀로 일괄등록
          </Link>
          <Link
            href="/customers/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 신규 고객 등록
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <Link
          href={query ? `/customers?q=${encodeURIComponent(query)}` : "/customers"}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
            !batchId ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                batchId === b.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
          className="w-full max-w-md rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
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
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/customers/${c.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${GRADE_BADGE[c.grade] ?? GRADE_BADGE.B}`}
                  >
                    {c.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.batch?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c._count.events > 0 && (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                        방문{c._count.events}차
                      </span>
                    )}
                    {c._count.contracts > 0 && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        체결
                      </span>
                    )}
                    {c.referredById && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                        소개
                      </span>
                    )}
                    {c._count.events === 0 && c._count.contracts === 0 && !c.referredById && (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.mobileConsent ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      동의
                    </span>
                  ) : (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-700">
                      미동의
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatPhone(c.phone)}</td>
                <td className="px-4 py-3 text-slate-600">{c.job ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c._count.consultations}건
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(c.birthDate)}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  {query ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        등급 기준: {GRADE_LABEL.A} · {GRADE_LABEL.B} · {GRADE_LABEL.C}
      </p>
    </div>
  );
}
