"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { requireUser } from "@/lib/auth";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createMessageTemplate(formData: FormData) {
  const user = await requireUser();

  const name = str(formData, "name");
  const category = str(formData, "category");
  const body = str(formData, "body");
  if (!name || !category || !body) throw new Error("템플릿 이름, 카테고리, 내용은 필수입니다");

  await prisma.messageTemplate.create({ data: { name, category, body, userId: user.id } });
  revalidatePath("/settings");
  redirectWithFlash("/settings", "템플릿이 추가되었습니다");
}

export async function updateMessageTemplate(templateId: string, formData: FormData) {
  const user = await requireUser();
  const body = str(formData, "body");
  if (!body) return;
  await prisma.messageTemplate.updateMany({
    where: { id: templateId, OR: [{ userId: user.id }, { userId: null }] },
    data: { body },
  });
  revalidatePath("/settings");
  revalidatePath("/messages");
  redirectWithFlash("/settings", "템플릿이 저장되었습니다");
}

export async function deleteMessageTemplate(templateId: string) {
  const user = await requireUser();
  await prisma.messageTemplate.delete({ where: { id: templateId, userId: user.id } });
  revalidatePath("/settings");
}

export async function createCallResultType(formData: FormData) {
  const user = await requireUser();

  const name = str(formData, "name");
  if (!name) throw new Error("결과 유형 이름은 필수입니다");

  const messageTemplateIdRaw = str(formData, "messageTemplateId") ?? null;
  let messageTemplateId: string | null = null;
  if (messageTemplateIdRaw) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: messageTemplateIdRaw, OR: [{ userId: null }, { userId: user.id }] },
      select: { id: true },
    });
    messageTemplateId = template ? template.id : null;
  }

  await prisma.callResultType.create({
    data: {
      userId: user.id,
      name,
      isDefault: false,
      messageTemplateId,
      createsCalendarEvent: formData.get("createsCalendarEvent") === "on",
    },
  });
  revalidatePath("/settings");
  revalidatePath("/calls");
  redirectWithFlash("/settings", "결과 유형이 추가되었습니다");
}

export async function deleteCallResultType(resultTypeId: string) {
  const user = await requireUser();
  await prisma.callResultType.delete({ where: { id: resultTypeId, userId: user.id } });
  revalidatePath("/settings");
  revalidatePath("/calls");
}

