import { prisma } from "@/lib/prisma";
import { createManualMessage } from "@/lib/actions/messages";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import { agentVars } from "@/lib/messageTemplate";
import MessageComposeForm from "@/components/MessageComposeForm";
import { requireUser } from "@/lib/auth";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const user = await requireUser();
  const { templateId } = await searchParams;

  const [customersRaw, recentContacts, currentMonthBatch, templates, contracts, upcomingVisits] = await Promise.all([
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(user.id),
    getCurrentMonthBatch(user.id),
    prisma.messageTemplate.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contract.findMany({
      where: { customer: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      select: { id: true, customerId: true, insurer: true, productName: true, expiryDate: true },
    }),
    prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        type: "VISIT",
        status: "SCHEDULED",
        customerId: { not: null },
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      select: { customerId: true, startAt: true, area: true },
    }),
  ]);
  const customers = customersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  const contractsByCustomer: Record<
    string,
    { id: string; insurer: string; productName: string; expiryDate: Date | null }[]
  > = {};
  for (const c of contracts) {
    (contractsByCustomer[c.customerId] ??= []).push({
      id: c.id,
      insurer: c.insurer,
      productName: c.productName,
      expiryDate: c.expiryDate,
    });
  }

  const nextVisitByCustomer: Record<string, { startAt: string; area: string | null }> = {};
  for (const v of upcomingVisits) {
    if (!v.customerId || nextVisitByCustomer[v.customerId]) continue;
    nextVisitByCustomer[v.customerId] = { startAt: v.startAt.toISOString(), area: v.area };
  }

  return (
    <MessageComposeForm
      action={createManualMessage}
      customers={customers}
      recentContacts={recentContacts}
      currentMonthBatchName={currentMonthBatch.batchName}
      currentMonthLabel={currentMonthBatch.label}
      templates={templates}
      contractsByCustomer={contractsByCustomer}
      nextVisitByCustomer={nextVisitByCustomer}
      initialTemplateId={templateId}
      agentVars={agentVars(user)}
    />
  );
}
