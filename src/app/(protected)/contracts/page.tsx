import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, daysUntil } from "@/lib/format";
import { deleteContract } from "@/lib/actions/contracts";
import ContractStatusSelect from "@/components/ContractStatusSelect";
import { requireUser } from "@/lib/auth";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ insurer?: string }>;
}) {
  const user = await requireUser();
  const { insurer: insurerFilter } = await searchParams;

  // 기존상품(PRE_EXISTING)은 이 설계사가 체결한 계약이 아니라 고객 상세페이지에서 확인 가능하므로,
  // 계약관리 목록에는 이 설계사가 직접 신규체결한 계약만 노출한다.
  const allContracts = await prisma.contract.findMany({
    where: { customer: { userId: user.id }, source: "AGENT_SALE" },
    orderBy: { expiryDate: "asc" },
    include: { customer: true },
  });

  const insurerCounts = allContracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.insurer] = (acc[c.insurer] ?? 0) + 1;
    return acc;
  }, {});
  const insurers = Object.keys(insurerCounts).sort((a, b) => insurerCounts[b] - insurerCounts[a]);

  const contracts = insurerFilter ? allContracts.filter((c) => c.insurer === insurerFilter) : allContracts;

  const byCategory = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">계약관리</h1>
          <p className="text-sm text-ink-muted mt-1">
            신규체결 {contracts.length}건
            {Object.keys(byCategory).length > 0 &&
              ` · ${Object.entries(byCategory)
                .map(([k, v]) => `${k} ${v}건`)
                .join(" · ")}`}
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + 계약 등록
        </Link>
      </div>

      {insurers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Link
            href="/contracts"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !insurerFilter ? "bg-primary text-white" : "bg-surface-muted text-ink-2 hover:bg-border/40"
            }`}
          >
            전체 {allContracts.length}
          </Link>
          {insurers.map((ins) => (
            <Link
              key={ins}
              href={`/contracts?insurer=${encodeURIComponent(ins)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                insurerFilter === ins ? "bg-primary text-white" : "bg-surface-muted text-ink-2 hover:bg-border/40"
              }`}
            >
              {ins} {insurerCounts[ins]}
            </Link>
          ))}
        </div>
      )}

      <div className="lg:hidden space-y-2">
        {contracts.map((c) => {
          const dLeft = c.expiryDate ? daysUntil(c.expiryDate) : null;
          return (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <span className="font-medium">{c.insurer}</span>
                    {dLeft !== null && dLeft <= 30 && dLeft >= 0 && (
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                        D-{dLeft}
                      </span>
                    )}
                  </div>
                  <Link href={`/customers/${c.customerId}`} className="mt-0.5 block truncate font-semibold text-ink hover:underline">
                    {c.customer.name} · {c.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(c.joinDate)} 가입 · {formatDate(c.expiryDate)} 만기
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  {c.premium ? `${c.premium.toLocaleString()}원` : "-"}
                </p>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <ContractStatusSelect contractId={c.id} status={c.status} />
                <form action={deleteContract.bind(null, c.id)}>
                  <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                    삭제
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {contracts.length === 0 && (
          <p className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
            등록된 계약이 없습니다
          </p>
        )}
      </div>

      <div className="hidden lg:block rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-ink-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">고객</th>
              <th className="px-4 py-3 font-medium">보험사</th>
              <th className="px-4 py-3 font-medium">상품명</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">만기일</th>
              <th className="px-4 py-3 font-medium">보험료</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const dLeft = c.expiryDate ? daysUntil(c.expiryDate) : null;
              return (
                <tr key={c.id} className="border-t border-border hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.customerId}`} className="font-medium text-primary hover:underline">
                      {c.customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{c.insurer}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {c.productName}
                    <span className="ml-1.5 rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{formatDate(c.joinDate)}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {formatDate(c.expiryDate)}
                    {c.status === "ACTIVE" && dLeft !== null && dLeft <= 30 && dLeft >= 0 && (
                      <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                        D-{dLeft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {c.premium ? `${c.premium.toLocaleString()}원` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ContractStatusSelect contractId={c.id} status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteContract.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  등록된 계약이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
