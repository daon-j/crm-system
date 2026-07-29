import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ImportForm from "@/components/ImportForm";
import { requireUser } from "@/lib/auth";

export default async function ImportCustomersPage() {
  const user = await requireUser();
  const batches = await prisma.customerBatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl">
      <Link href="/customers" className="text-sm text-ink-muted hover:underline">
        ← 고객목록
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-1 mt-1">엑셀로 고객 일괄등록</h1>
      <p className="text-sm text-ink-muted mb-6">
        매월 받는 고객DB 리스트를 엑셀 그대로 업로드하면 한 번에 등록됩니다.
      </p>

      <a
        href="/api/customers/template"
        className="inline-block mb-6 text-sm font-medium text-primary hover:underline"
      >
        엑셀 양식 다운로드 ↓
      </a>

      <ImportForm batches={batches} />
    </div>
  );
}
