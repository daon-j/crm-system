import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, daysUntil } from "@/lib/format";
import { deleteContract } from "@/lib/actions/contracts";
import ContractStatusSelect from "@/components/ContractStatusSelect";
import { requireUser } from "@/lib/auth";

export default async function ContractsPage() {
  const user = await requireUser();
  const contracts = await prisma.contract.findMany({
    where: { customer: { userId: user.id } },
    orderBy: { expiryDate: "asc" },
    include: { customer: true },
  });

  const byCategory = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});
  const agentSaleCount = contracts.filter((c) => c.source === "AGENT_SALE").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">계약관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            {Object.entries(byCategory)
              .map(([k, v]) => `${k} ${v}건`)
              .join(" · ") || "등록된 계약이 없습니다"}
            {contracts.length > 0 && ` · 신규체결 ${agentSaleCount}건`}
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 계약 등록
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">고객</th>
              <th className="px-4 py-3 font-medium">구분</th>
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
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.customerId}`} className="font-medium text-blue-700 hover:underline">
                      {c.customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        c.source === "AGENT_SALE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {c.source === "AGENT_SALE" ? "신규체결" : "기존상품"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.insurer}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.productName}
                    <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.joinDate)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(c.expiryDate)}
                    {c.status === "ACTIVE" && dLeft !== null && dLeft <= 30 && dLeft >= 0 && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                        D-{dLeft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.premium ? `${c.premium.toLocaleString()}원` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <ContractStatusSelect contractId={c.id} status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteContract.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
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
