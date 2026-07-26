import { prisma } from "@/lib/prisma";
import { createManualMessage } from "@/lib/actions/messages";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import MessageComposeForm from "@/components/MessageComposeForm";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const { templateId } = await searchParams;

  const [customersRaw, recentContacts, currentMonthBatch, templates, contracts] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(),
    getCurrentMonthBatch(),
    prisma.messageTemplate.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, customerId: true, insurer: true, productName: true },
    }),
  ]);
  const customers = customersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  const contractsByCustomer: Record<string, { id: string; insurer: string; productName: string }[]> = {};
  for (const c of contracts) {
    (contractsByCustomer[c.customerId] ??= []).push({
      id: c.id,
      insurer: c.insurer,
      productName: c.productName,
    });
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
      initialTemplateId={templateId}
    />
  );
}
