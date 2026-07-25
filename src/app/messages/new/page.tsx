import { prisma } from "@/lib/prisma";
import { createManualMessage } from "@/lib/actions/messages";
import ReferrerCombobox from "@/components/ReferrerCombobox";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";

export default async function NewMessagePage() {
  const [customersRaw, recentContacts, currentMonthBatch] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
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
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">새 문자 작성</h1>
      <form action={createManualMessage} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            받는 고객 <span className="text-red-500">*</span>
          </label>
          <ReferrerCombobox
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatch.batchName}
            currentMonthLabel={currentMonthBatch.label}
            showMonthQuickPicks={false}
            showChosungIndex={false}
            name="customerId"
            placeholder="이름, 전화번호, 초성으로 검색"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            문구 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            required
            rows={6}
            placeholder="문자 내용을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            발송대기 목록에 추가됩니다. 문자함에서 최종 확인 후 발송(복사)하면 발송완료로 이동합니다.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          대기함에 추가
        </button>
      </form>
    </div>
  );
}
