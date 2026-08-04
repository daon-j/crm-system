"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { requireUser } from "@/lib/auth";
import { agentVars } from "@/lib/messageTemplate";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] ?? `{{${key.trim()}}}`);
}

export async function createConsultation(formData: FormData) {
  const user = await requireUser();

  const customerId = str(formData, "customerId");
  const content = str(formData, "content");
  if (!customerId || !content) throw new Error("고객과 상담내용은 필수입니다");

  const resultTypeId = str(formData, "resultTypeId");
  const nextContactDateStr = str(formData, "nextContactDate");
  const visitDateStr = str(formData, "visitDate");

  const customer = await prisma.customer.findFirstOrThrow({
    where: { id: customerId, userId: user.id },
  });

  const resultType = resultTypeId
    ? await prisma.callResultType.findFirst({
        where: { id: resultTypeId, OR: [{ userId: null }, { userId: user.id }] },
        include: { messageTemplate: true },
      })
    : null;

  await prisma.consultation.create({
    data: {
      customerId,
      content,
      resultTypeId: resultType?.id,
      nextContactDate: nextContactDateStr ? new Date(nextContactDateStr) : null,
      visitDate: visitDateStr ? new Date(visitDateStr) : null,
    },
  });

  if (resultType?.messageTemplate) {
    const filled = fillTemplate(resultType.messageTemplate.body, {
      고객명: customer.name,
      ...agentVars(user),
      방문일시: visitDateStr
        ? new Date(visitDateStr).toLocaleString("ko-KR", {
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    });

    await prisma.message.create({
      data: {
        userId: user.id,
        customerId,
        templateId: resultType.messageTemplate.id,
        content: filled,
        status: "PENDING",
        triggerType: resultType.messageTemplate.category,
      },
    });
  }

  if (resultType?.createsCalendarEvent && visitDateStr) {
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: `${customer.name} 고객 방문`,
        type: "VISIT",
        startAt: new Date(visitDateStr),
        customerId,
        memo: content,
        companion: str(formData, "visitCompanion"),
        area: str(formData, "visitArea"),
      },
    });
  }

  revalidatePath("/calls");
  revalidatePath("/messages");
  revalidatePath("/calendar");
  revalidatePath(`/customers/${customerId}`);
  redirectWithFlash(`/customers/${customerId}`, "상담내용이 저장되었습니다");
}
