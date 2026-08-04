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

export async function createEvent(formData: FormData) {
  const user = await requireUser();

  const title = str(formData, "title");
  const startAtStr = str(formData, "startAt");
  if (!title || !startAtStr) throw new Error("제목과 일시는 필수입니다");

  const type = str(formData, "type");
  const customerIdRaw = str(formData, "customerId") ?? null;
  let customerId: string | null = null;
  if (customerIdRaw) {
    const owned = await prisma.customer.findFirst({
      where: { id: customerIdRaw, userId: user.id },
      select: { id: true },
    });
    customerId = owned ? owned.id : null;
  }

  const event = await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title,
      type: type === "VISIT" || type === "TRAINING" ? type : "CUSTOM",
      startAt: new Date(startAtStr),
      memo: str(formData, "memo"),
      companion: str(formData, "companion"),
      area: str(formData, "area"),
      prepNote: str(formData, "prepNote"),
      customerId,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.customerId) revalidatePath(`/customers/${event.customerId}`);
  redirectWithFlash(event.customerId ? `/customers/${event.customerId}` : "/calendar", "일정이 등록되었습니다");
}

export async function updateEvent(eventId: string, formData: FormData) {
  const user = await requireUser();

  const title = str(formData, "title");
  const startAtStr = str(formData, "startAt");
  if (!title || !startAtStr) throw new Error("제목과 일시는 필수입니다");

  const existing = await prisma.calendarEvent.findFirstOrThrow({ where: { id: eventId, userId: user.id } });
  const newStartAt = new Date(startAtStr);
  const type = str(formData, "type");
  const reason = str(formData, "reason");

  const event = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title,
      type: type === "VISIT" || type === "TRAINING" || type === "ROUTINE" ? type : "CUSTOM",
      startAt: newStartAt,
      memo: str(formData, "memo") ?? null,
      companion: str(formData, "companion") ?? null,
      area: str(formData, "area") ?? null,
      prepNote: str(formData, "prepNote") ?? null,
    },
  });

  if (existing.startAt.getTime() !== newStartAt.getTime()) {
    await prisma.calendarEventLog.create({
      data: {
        eventId,
        action: "RESCHEDULED",
        previousStartAt: existing.startAt,
        newStartAt,
        reason,
      },
    });
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.customerId) revalidatePath(`/customers/${event.customerId}`);
  redirectWithFlash(event.customerId ? `/customers/${event.customerId}` : "/calendar", "일정이 변경되었습니다");
}

// 정보미팅/오전교육 참석 여부 수동 기록 - 있으면 학습노트 기반 자동판단보다 우선한다.
export async function setRoutineAttendance(dateStr: string, type: "MEETING" | "TRAINING", attended: boolean) {
  const user = await requireUser();
  await prisma.routineAttendance.upsert({
    where: { userId_date_type: { userId: user.id, date: new Date(dateStr), type } },
    create: { userId: user.id, date: new Date(dateStr), type, attended },
    update: { attended },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
}

// 방문/일정을 취소한다. 데이터는 지우지 않고 상태만 CANCELED로 바꿔서
// 언제·왜 취소했는지 이력이 그대로 남도록 한다.
export async function cancelEvent(eventId: string, formData: FormData) {
  const user = await requireUser();

  const existing = await prisma.calendarEvent.findFirstOrThrow({ where: { id: eventId, userId: user.id } });
  const reason = str(formData, "reason");

  const event = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: { status: "CANCELED" },
  });

  await prisma.calendarEventLog.create({
    data: {
      eventId,
      action: "CANCELED",
      previousStartAt: existing.startAt,
      reason,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.customerId) revalidatePath(`/customers/${event.customerId}`);
  redirectWithFlash(event.customerId ? `/customers/${event.customerId}` : "/calendar", "일정이 취소되었습니다");
}
