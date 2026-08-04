"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { resolveBatchId } from "@/lib/batch";
import { requireUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

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

async function assertOwnsCustomer(customerId: string, userId: string) {
  const owned = await prisma.customer.findFirst({ where: { id: customerId, userId }, select: { id: true } });
  if (!owned) throw new Error("고객을 찾을 수 없습니다");
}

export async function createCustomer(formData: FormData) {
  const user = await requireUser();

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

  const batchId = await resolveBatchId(formData, user.id);
  const referredByIdRaw = str(formData, "referredById") ?? null;
  let referredById: string | null = null;
  if (referredByIdRaw) {
    const referrer = await prisma.customer.findFirst({
      where: { id: referredByIdRaw, userId: user.id },
      select: { id: true },
    });
    referredById = referrer ? referrer.id : null;
  }

  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      name,
      gender,
      residentNumber: encrypt(residentNumber),
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
  redirectWithFlash(`/customers/${customer.id}`, "고객이 등록되었습니다");
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const user = await requireUser();
  await assertOwnsCustomer(customerId, user.id);

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

  const batchId = await resolveBatchId(formData, user.id);
  const referredByIdRaw = str(formData, "referredById") ?? null;
  let referredById: string | null = null;
  if (referredByIdRaw && referredByIdRaw !== customerId) {
    const referrer = await prisma.customer.findFirst({
      where: { id: referredByIdRaw, userId: user.id },
      select: { id: true },
    });
    referredById = referrer ? referrer.id : null;
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name,
      gender,
      residentNumber: encrypt(residentNumber),
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
  redirectWithFlash(`/customers/${customerId}`, "고객 정보가 수정되었습니다");
}

export async function deleteCustomer(customerId: string) {
  const user = await requireUser();
  await assertOwnsCustomer(customerId, user.id);

  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/customers");
  redirectWithFlash("/customers", "고객이 삭제되었습니다");
}

export async function addFamilyMember(customerId: string, formData: FormData) {
  const user = await requireUser();
  await assertOwnsCustomer(customerId, user.id);

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
  const user = await requireUser();
  await assertOwnsCustomer(customerId, user.id);

  await prisma.family.delete({ where: { id: familyId, customerId } });
  revalidatePath(`/customers/${customerId}`);
}
