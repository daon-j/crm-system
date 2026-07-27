import { prisma } from "@/lib/prisma";

// formData의 "newBatchName"(새 배치명) 또는 "batchId"(기존 배치 선택)를 읽어
// 배치 id를 반환한다. 새 배치명이 있으면 없는 경우 생성하고, 둘 다 없으면 null.
export async function resolveBatchId(formData: FormData, userId: string): Promise<string | null> {
  const newBatchName = formData.get("newBatchName");
  if (typeof newBatchName === "string" && newBatchName.trim() !== "") {
    const name = newBatchName.trim();
    const batch = await prisma.customerBatch.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { name, userId },
    });
    return batch.id;
  }

  const batchId = formData.get("batchId");
  if (typeof batchId === "string" && batchId.trim() !== "") {
    const id = batchId.trim();
    const owned = await prisma.customerBatch.findFirst({ where: { id, userId }, select: { id: true } });
    return owned ? owned.id : null;
  }

  return null;
}
