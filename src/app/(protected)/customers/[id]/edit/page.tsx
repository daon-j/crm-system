import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerForm from "@/components/CustomerForm";
import { updateCustomer } from "@/lib/actions/customers";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import { requireUser } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [customer, batches, allCustomersRaw, recentContacts, currentMonthBatch] = await Promise.all([
    prisma.customer.findFirst({ where: { id, userId: user.id } }),
    prisma.customerBatch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(user.id),
    getCurrentMonthBatch(user.id),
  ]);
  if (!customer) notFound();

  const boundUpdate = updateCustomer.bind(null, customer.id);
  const referrableCustomers = allCustomersRaw
    .filter((c) => c.id !== customer.id)
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, batchName: c.batch?.name ?? null }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {customer.name} 고객정보 수정
      </h1>
      <CustomerForm
        action={boundUpdate}
        initial={{
          ...customer,
          residentNumber: customer.residentNumber ? decrypt(customer.residentNumber) : null,
        }}
        submitLabel="저장하기"
        batches={batches}
        referrableCustomers={referrableCustomers}
        recentContacts={recentContacts.filter((rc) => rc.id !== customer.id)}
        currentMonthBatchName={currentMonthBatch.batchName}
        currentMonthLabel={currentMonthBatch.label}
      />
    </div>
  );
}
