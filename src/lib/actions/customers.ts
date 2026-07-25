"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveBatchId } from "@/lib/batch";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function parseMobileConsent(formData: FormData): { mobileConsent: boolean; mobileConsentDate: Date | null } {
  const raw = str(formData, "mobileConsent");
  if (raw !== "Y" && raw !== "N") {
    throw new Error("모바일동의 여부는 필수입니다");
  }
  const dateStr = str(formData, "mobileConsentDate");
  if (raw === "Y" && !dateStr) {
    throw new Error("모바일동의(Y)를 선택한 경우 동의일자는 필수입니다");
  }
  return {
    mobileConsent: raw === "Y",
    mobileConsentDate: raw === "Y" && dateStr ? new Date(dateStr) : null,
  };
}

export async function createCustomer(formData: FormData) {
  const name = str(formData, "name");
  const birthDate = str(formData, "birthDate");
  const phone = str(formData, "phone");
  const address = str(formData, "address");
  const job = str(formData, "job");
  const gender = str(formData, "gender");
  const residentNumber = str(formData, "residentNumber");
  if (!name || !birthDate || !phone || !address || !job || !gender || !residentNumber) {
    throw new Error("이름, 생년월일, 연락처, 주소, 직업, 성별, 주민등록번호는 필수입니다");
  }

  const contractInsurer = str(formData, "contractInsurer");
  const contractProductName = str(formData, "contractProductName");
  const contractJoinDate = str(formData, "contractJoinDate");
  if (contractProductName && (!contractInsurer || !contractJoinDate)) {
    throw new Error("상품명을 입력하려면 보험사와 가입일도 함께 입력해주세요");
  }

  const { mobileConsent, mobileConsentDate } = parseMobileConsent(formData);

  const batchId = await resolveBatchId(formData);
  const referredById = str(formData, "referredById") ?? null;

  const customer = await prisma.customer.create({
    data: {
      name,
      gender,
      residentNumber,
      birthDate: new Date(birthDate),
      phone,
      address,
      job,
      email: str(formData, "email"),
      grade: str(formData, "grade") ?? "B",
      marketingOptIn: formData.get("marketingOptIn") === "on",
      mobileConsent,
      mobileConsentDate,
      memo: str(formData, "memo"),
      batchId,
      referredById,
    },
  });

  if (contractProductName && contractInsurer && contractJoinDate) {
    const contractExpiryDate = str(formData, "contractExpiryDate");
    const premiumStr = str(formData, "contractPremium");

    await prisma.contract.create({
      data: {
        customerId: customer.id,
        insurer: contractInsurer,
        productName: contractProductName,
        category: "기타",
        joinDate: new Date(contractJoinDate),
        expiryDate: contractExpiryDate ? new Date(contractExpiryDate) : null,
        premium: premiumStr ? parseInt(premiumStr, 10) : null,
        source: "PRE_EXISTING",
      },
    });
  }

  revalidatePath("/customers");
  revalidatePath("/contracts");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const name = str(formData, "name");
  const birthDate = str(formData, "birthDate");
  const phone = str(formData, "phone");
  const address = str(formData, "address");
  const job = str(formData, "job");
  const gender = str(formData, "gender");
  const residentNumber = str(formData, "residentNumber");
  if (!name || !birthDate || !phone || !address || !job || !gender || !residentNumber) {
    throw new Error("이름, 생년월일, 연락처, 주소, 직업, 성별, 주민등록번호는 필수입니다");
  }

  const { mobileConsent, mobileConsentDate } = parseMobileConsent(formData);

  const batchId = await resolveBatchId(formData);
  const referredByIdRaw = str(formData, "referredById") ?? null;
  const referredById = referredByIdRaw === customerId ? null : referredByIdRaw;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name,
      gender,
      residentNumber,
      birthDate: new Date(birthDate),
      phone,
      address,
      job,
      email: str(formData, "email"),
      grade: str(formData, "grade") ?? "B",
      marketingOptIn: formData.get("marketingOptIn") === "on",
      mobileConsent,
      mobileConsentDate,
      memo: str(formData, "memo"),
      batchId,
      referredById,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function deleteCustomer(customerId: string) {
  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/customers");
  redirect("/customers");
}

export async function addFamilyMember(customerId: string, formData: FormData) {
  const relation = str(formData, "relation");
  if (!relation) throw new Error("관계는 필수입니다");

  await prisma.family.create({
    data: {
      customerId,
      relation,
      name: str(formData, "name"),
      birthDate: str(formData, "birthDate") ? new Date(str(formData, "birthDate")!) : null,
      memo: str(formData, "memo"),
    },
  });

  revalidatePath(`/customers/${customerId}`);
}

export async function deleteFamilyMember(customerId: string, familyId: string) {
  await prisma.family.delete({ where: { id: familyId } });
  revalidatePath(`/customers/${customerId}`);
}
