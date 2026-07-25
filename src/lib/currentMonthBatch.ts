import { prisma } from "@/lib/prisma";

export type CurrentMonthBatch = {
  label: string; // 예: "7월DB"
  batchName: string | null; // 예: "2026년 7월DB" (없으면 null)
};

// "이번달"은 등록일 기준이 아니라, 이번달에 회사에서 받은 고객DB 배치(예: "2026년 7월DB") 기준
export async function getCurrentMonthBatch(): Promise<CurrentMonthBatch> {
  const now = new Date();
  const monthNum = now.getMonth() + 1;
  const label = `${monthNum}월DB`;
  const pattern = new RegExp(`^${now.getFullYear()}\\s*년\\s*${monthNum}\\s*월`);

  const batches = await prisma.customerBatch.findMany({ select: { name: true } });
  const matched = batches.find((b) => pattern.test(b.name));

  return { label, batchName: matched?.name ?? null };
}
