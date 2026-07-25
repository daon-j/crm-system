"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createContract(formData: FormData) {
  const customerId = str(formData, "customerId");
  const insurer = str(formData, "insurer");
  const productName = str(formData, "productName");
  const category = str(formData, "category");
  const joinDate = str(formData, "joinDate");
  const expiryDate = str(formData, "expiryDate");

  if (!customerId || !insurer || !productName || !category || !joinDate || !expiryDate) {
    throw new Error("필수 항목을 모두 입력해주세요");
  }

  const premiumStr = str(formData, "premium");
  const source = str(formData, "source") === "PRE_EXISTING" ? "PRE_EXISTING" : "AGENT_SALE";

  await prisma.contract.create({
    data: {
      customerId,
      insurer,
      productName,
      category,
      joinDate: new Date(joinDate),
      expiryDate: new Date(expiryDate),
      premium: premiumStr ? parseInt(premiumStr, 10) : null,
      source,
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function updateContractStatus(contractId: string, status: string) {
  const contract = await prisma.contract.update({
    where: { id: contractId },
    data: { status },
  });
  revalidatePath("/contracts");
  revalidatePath(`/customers/${contract.customerId}`);
}

export async function deleteContract(contractId: string) {
  const contract = await prisma.contract.delete({ where: { id: contractId } });
  revalidatePath("/contracts");
  revalidatePath(`/customers/${contract.customerId}`);
}
