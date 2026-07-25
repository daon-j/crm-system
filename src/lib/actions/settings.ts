"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createMessageTemplate(formData: FormData) {
  const name = str(formData, "name");
  const category = str(formData, "category");
  const body = str(formData, "body");
  if (!name || !category || !body) throw new Error("템플릿 이름, 카테고리, 내용은 필수입니다");

  await prisma.messageTemplate.create({ data: { name, category, body } });
  revalidatePath("/settings");
}

export async function updateMessageTemplate(templateId: string, formData: FormData) {
  const body = str(formData, "body");
  if (!body) return;
  await prisma.messageTemplate.update({ where: { id: templateId }, data: { body } });
  revalidatePath("/settings");
}

export async function deleteMessageTemplate(templateId: string) {
  await prisma.messageTemplate.delete({ where: { id: templateId } });
  revalidatePath("/settings");
}

export async function createCallResultType(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("결과 유형 이름은 필수입니다");

  await prisma.callResultType.create({
    data: {
      name,
      isDefault: false,
      messageTemplateId: str(formData, "messageTemplateId") ?? null,
      createsCalendarEvent: formData.get("createsCalendarEvent") === "on",
    },
  });
  revalidatePath("/settings");
  revalidatePath("/calls");
}

export async function deleteCallResultType(resultTypeId: string) {
  await prisma.callResultType.delete({ where: { id: resultTypeId } });
  revalidatePath("/settings");
  revalidatePath("/calls");
}
