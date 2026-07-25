import { prisma } from "@/lib/prisma";
import ImportForm from "@/components/ImportForm";

export default async function ImportCustomersPage() {
  const batches = await prisma.customerBatch.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">엑셀로 고객 일괄등록</h1>
      <p className="text-sm text-slate-500 mb-6">
        매월 받는 고객DB 리스트를 엑셀 그대로 업로드하면 한 번에 등록됩니다.
      </p>

      <a
        href="/api/customers/template"
        className="inline-block mb-6 text-sm font-medium text-blue-600 hover:underline"
      >
        엑셀 양식 다운로드 ↓
      </a>

      <ImportForm batches={batches} />
    </div>
  );
}
