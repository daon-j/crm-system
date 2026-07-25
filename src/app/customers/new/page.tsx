import { prisma } from "@/lib/prisma";
import CustomerForm from "@/components/CustomerForm";
import { createCustomer } from "@/lib/actions/customers";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";

export default async function NewCustomerPage() {
  const [batches, referrableCustomersRaw, recentContacts, currentMonthBatch] = await Promise.all([
    prisma.customerBatch.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(),
    getCurrentMonthBatch(),
  ]);
  const referrableCustomers = referrableCustomersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">신규 고객 등록</h1>
      <CustomerForm
        action={createCustomer}
        submitLabel="등록하기"
        showContractFields
        batches={batches}
        referrableCustomers={referrableCustomers}
        recentContacts={recentContacts}
        currentMonthBatchName={currentMonthBatch.batchName}
        currentMonthLabel={currentMonthBatch.label}
      />
    </div>
  );
}
