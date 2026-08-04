"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { fillTemplate, agentVars } from "@/lib/messageTemplate";
import { requireUser } from "@/lib/auth";

export async function createManualMessage(formData: FormData) {
  const user = await requireUser();

  const customerId = formData.get("customerId");
  const content = formData.get("content");
  if (typeof customerId !== "string" || customerId.trim() === "") {
    throw new Error("받는 고객을 선택해주세요");
  }
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("문자 내용은 필수입니다");
  }

  await prisma.customer.findFirstOrThrow({ where: { id: customerId.trim(), userId: user.id } });

  await prisma.message.create({
    data: {
      userId: user.id,
      customerId: customerId.trim(),
      content: content.trim(),
      status: "PENDING",
      triggerType: "CUSTOM",
    },
  });

  revalidatePath("/messages");
  redirectWithFlash("/messages", "문자가 등록되었습니다");
}

export async function sendMessage(messageId: string) {
  const user = await requireUser();
  await prisma.message.update({
    where: { id: messageId, userId: user.id },
    data: { status: "SENT", sentAt: new Date() },
  });
  revalidatePath("/messages");
}

export async function cancelMessage(messageId: string) {
  const user = await requireUser();
  await prisma.message.update({
    where: { id: messageId, userId: user.id },
    data: { status: "CANCELED" },
  });
  revalidatePath("/messages");
}

export async function updateMessageContent(messageId: string, formData: FormData) {
  const user = await requireUser();
  const content = formData.get("content");
  if (typeof content !== "string" || content.trim() === "") return;
  await prisma.message.update({
    where: { id: messageId, userId: user.id },
    data: { content: content.trim() },
  });
  revalidatePath("/messages");
}

// 오늘 생일 / 이번달 안부 / 만기 30일전 대상을 스캔해서 문자함에 자동 등록
export async function generateAutoMessages(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [birthdayTpl, monthlyTpl, expiryTpl] = await Promise.all([
    prisma.messageTemplate.findUnique({ where: { id: "tpl-birthday" } }),
    prisma.messageTemplate.findUnique({ where: { id: "tpl-monthly" } }),
    prisma.messageTemplate.findUnique({ where: { id: "tpl-expiry" } }),
  ]);

  const [customers, agent] = await Promise.all([
    prisma.customer.findMany({ where: { userId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const vars = agentVars(agent);
  let created = 0;

  // 1. 오늘 생일
  if (birthdayTpl) {
    for (const c of customers) {
      if (!c.birthDate) continue;
      const b = new Date(c.birthDate);
      if (b.getMonth() !== today.getMonth() || b.getDate() !== today.getDate()) continue;

      const already = await prisma.message.findFirst({
        where: {
          customerId: c.id,
          templateId: birthdayTpl.id,
          createdAt: { gte: today },
        },
      });
      if (already) continue;

      await prisma.message.create({
        data: {
          userId,
          customerId: c.id,
          templateId: birthdayTpl.id,
          content: fillTemplate(birthdayTpl.body, { 고객명: c.name, ...vars }),
          status: "PENDING",
          triggerType: birthdayTpl.category,
        },
      });
      created++;
    }
  }

  // 2. 이번달 안부문자 (마케팅 수신동의 고객만)
  if (monthlyTpl) {
    for (const c of customers) {
      if (!c.marketingOptIn) continue;

      const already = await prisma.message.findFirst({
        where: {
          customerId: c.id,
          templateId: monthlyTpl.id,
          createdAt: { gte: monthStart },
        },
      });
      if (already) continue;

      await prisma.message.create({
        data: {
          userId,
          customerId: c.id,
          templateId: monthlyTpl.id,
          content: fillTemplate(monthlyTpl.body, { 고객명: c.name, ...vars }),
          status: "PENDING",
          triggerType: monthlyTpl.category,
        },
      });
      created++;
    }
  }

  // 3. 만기 30일 이내 계약
  if (expiryTpl) {
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const contracts = await prisma.contract.findMany({
      where: { status: "ACTIVE", expiryDate: { gte: today, lte: in30 }, customer: { userId } },
      include: { customer: true },
    });

    for (const contract of contracts) {
      if (!contract.expiryDate) continue;
      const already = await prisma.message.findFirst({
        where: {
          customerId: contract.customerId,
          templateId: expiryTpl.id,
          content: { contains: contract.productName },
        },
      });
      if (already) continue;

      await prisma.message.create({
        data: {
          userId,
          customerId: contract.customerId,
          templateId: expiryTpl.id,
          content: fillTemplate(expiryTpl.body, {
            고객명: contract.customer.name,
            ...vars,
            상품명: contract.productName,
            만기일: contract.expiryDate.toLocaleDateString("ko-KR"),
          }),
          status: "PENDING",
          triggerType: expiryTpl.category,
        },
      });
      created++;
    }
  }

  revalidatePath("/messages");
  return created;
}

export async function runGenerateAutoMessages() {
  const user = await requireUser();
  await generateAutoMessages(user.id);
}
