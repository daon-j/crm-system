import { prisma } from "@/lib/prisma";
import { createEvent } from "@/lib/actions/calendar";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import NewEventForm from "@/components/NewEventForm";
import { requireUser } from "@/lib/auth";

export default async function NewCalendarEventPage() {
  const user = await requireUser();

  const [customersRaw, recentContacts, currentMonthBatch] = await Promise.all([
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(user.id),
    getCurrentMonthBatch(user.id),
  ]);
  const customers = customersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  return (
    <NewEventForm
      action={createEvent}
      customers={customers}
      recentContacts={recentContacts}
      currentMonthBatchName={currentMonthBatch.batchName}
      currentMonthLabel={currentMonthBatch.label}
    />
  );
}
