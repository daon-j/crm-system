import { prisma } from "@/lib/prisma";
import { createConsultation } from "@/lib/actions/calls";
import { formatDateTime } from "@/lib/format";
import ReferrerCombobox from "@/components/ReferrerCombobox";
import CancelButton from "@/components/CancelButton";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;

  const [customersRaw, resultTypes, recentCalls, recentContacts, currentMonthBatch] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    prisma.callResultType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { customer: true, resultType: true },
    }),
    getRecentContacts(),
    getCurrentMonthBatch(),
  ]);
  const customers = customersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">콜 상담</h1>
      <p className="text-sm text-slate-500 mb-6">
        상담 내용을 저장하면 결과에 따라 문자함에 발송 대상이 자동으로 등록됩니다.
      </p>

      <form
        action={createConsultation}
        noValidate
        className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 mb-8"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            고객 <span className="text-red-500">*</span>
          </label>
          <ReferrerCombobox
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatch.batchName}
            currentMonthLabel={currentMonthBatch.label}
            showMonthQuickPicks={false}
            showChosungIndex={false}
            initialId={customerId}
            name="customerId"
            placeholder="이름, 전화번호, 초성으로 검색"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            상담내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            required
            rows={3}
            placeholder="예) 실손보험 설명, 암보험 검토"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            콜 결과
          </label>
          <select
            name="resultTypeId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택 안함</option>
            {resultTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            콜결과 종류는 설정 화면에서 자유롭게 추가/수정할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              다음 연락일
            </label>
            <input
              type="date"
              name="nextContactDate"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              방문 예정일시
            </label>
            <input
              type="datetime-local"
              name="visitDate"
              step={1800}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">동반자</label>
            <input
              type="text"
              name="visitCompanion"
              placeholder="예) 홍길동 멘토"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">방문 지역</label>
            <input
              type="text"
              name="visitArea"
              placeholder="예) 다산동"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            상담내용 저장
          </button>
          <CancelButton />
        </div>
      </form>

      <h2 className="text-sm font-semibold text-slate-900 mb-3">최근 상담 15건</h2>
      <div className="space-y-3">
        {recentCalls.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3.5 text-sm">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{formatDateTime(c.createdAt)}</span>
              <span className="font-medium text-slate-600">{c.customer.name}</span>
              {c.resultType && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  {c.resultType.name}
                </span>
              )}
            </div>
            <p className="text-slate-700 mt-1">{c.content}</p>
          </div>
        ))}
        {recentCalls.length === 0 && (
          <p className="text-sm text-slate-400">상담이력이 없습니다</p>
        )}
      </div>
    </div>
  );
}
