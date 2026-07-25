import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export type RecentContact = { id: string; label: string };

// 최근 콜상담/방문 일정에 등장한 고객을 최신순으로 중복없이 반환 (소개자·수신자 선택 시 빠른 선택용)
export async function getRecentContacts(limit = 5): Promise<RecentContact[]> {
  const [consultations, events] = await Promise.all([
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      select: { customerId: true, createdAt: true, customer: { select: { name: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { customerId: { not: null }, status: "SCHEDULED" },
      orderBy: { startAt: "desc" },
      take: limit * 3,
      select: { customerId: true, startAt: true, customer: { select: { name: true } } },
    }),
  ]);

  type Item = { customerId: string; name: string; at: Date; kind: "콜" | "방문" };
  const merged: Item[] = [
    ...consultations.map((c) => ({
      customerId: c.customerId,
      name: c.customer.name,
      at: c.createdAt,
      kind: "콜" as const,
    })),
    ...events
      .filter((e): e is typeof e & { customerId: string; customer: { name: string } } => !!e.customerId && !!e.customer)
      .map((e) => ({ customerId: e.customerId, name: e.customer.name, at: e.startAt, kind: "방문" as const })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const seen = new Set<string>();
  const result: RecentContact[] = [];
  for (const item of merged) {
    if (seen.has(item.customerId)) continue;
    seen.add(item.customerId);
    result.push({ id: item.customerId, label: `${item.name} · ${item.kind} ${formatDate(item.at)}` });
    if (result.length >= limit) break;
  }
  return result;
}
