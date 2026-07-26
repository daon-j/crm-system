import { prisma } from "@/lib/prisma";
import { createContract } from "@/lib/actions/contracts";
import { toDateInputValue } from "@/lib/format";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">계약 등록</h1>
      <form action={createContract} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            고객 <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            required
            defaultValue={customerId ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          >
            <option value="" disabled>
              고객 선택
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">구분</label>
          <select
            name="source"
            defaultValue="AGENT_SALE"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          >
            <option value="AGENT_SALE">신규 체결 (내가 이번에 체결)</option>
            <option value="PRE_EXISTING">기존 가입상품 (등록 누락된 기존 계약 추가)</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            신규 체결만 &quot;체결고객&quot; 배지와 이번달 신규계약 통계에 반영됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              보험사 <span className="text-red-500">*</span>
            </label>
            <input
              name="insurer"
              required
              placeholder="예) DB손해보험"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              상품명 <span className="text-red-500">*</span>
            </label>
            <input
              name="productName"
              required
              placeholder="예) 실손보험"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            상품 종류 <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          >
            <option value="" disabled>
              선택
            </option>
            <option value="실손보험">실손보험</option>
            <option value="암보험">암보험</option>
            <option value="운전자보험">운전자보험</option>
            <option value="종신보험">종신보험</option>
            <option value="연금보험">연금보험</option>
            <option value="화재보험">화재보험</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              가입일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={toDateInputValue(new Date())}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              만기일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expiryDate"
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            월 보험료 (원)
          </label>
          <input
            type="number"
            name="premium"
            placeholder="예) 35000"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          등록하기
        </button>
      </form>
    </div>
  );
}
