import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/format";

export type DayItem = {
  key: string;
  label: string;
  type: "ROUTINE" | "VISIT" | "TRAINING" | "CUSTOM" | "BIRTHDAY" | "EXPIRY";
  href?: string;
  eventId?: string;
  // ROUTINE(정보미팅/오전교육) 전용 - 참석 여부 및 토글에 필요한 정보
  attended?: boolean;
  routineDate?: string;
  routineType?: "MEETING" | "TRAINING";
};

const MEETING_CATEGORIES = ["정보미팅", "MORNING_MEETING"];
const TRAINING_CATEGORIES = ["오전교육", "MORNING_TRAINING"];

export const TYPE_STYLE: Record<DayItem["type"], string> = {
  ROUTINE: "bg-slate-100 text-slate-500",
  VISIT: "bg-blue-100 text-blue-700",
  TRAINING: "bg-emerald-100 text-emerald-700",
  CUSTOM: "bg-violet-100 text-violet-700",
  BIRTHDAY: "bg-pink-100 text-pink-700",
  EXPIRY: "bg-amber-100 text-amber-800",
};

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eachDay(rangeStart: Date, dayCount: number): Date[] {
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// 고객별 VISIT 이벤트를 시간순으로 정렬해 몇 번째 방문인지(1차/2차/...) 매핑을 만든다.
// 완료 여부와 무관하게 예정된 방문도 포함해서 "이번이 몇 번째 만남인지"를 셈한다.
export async function getVisitSequenceMap(customerIds: string[], userId: string): Promise<Map<string, number>> {
  if (customerIds.length === 0) return new Map();

  const events = await prisma.calendarEvent.findMany({
    where: { userId, type: "VISIT", status: "SCHEDULED", customerId: { in: customerIds } },
    orderBy: { startAt: "asc" },
    select: { id: true, customerId: true },
  });

  const counters = new Map<string, number>();
  const seqById = new Map<string, number>();
  for (const e of events) {
    if (!e.customerId) continue;
    const next = (counters.get(e.customerId) ?? 0) + 1;
    counters.set(e.customerId, next);
    seqById.set(e.id, next);
  }
  return seqById;
}

// rangeStart~rangeEnd(포함) 사이의 방문/교육/기타 일정 + 루틴 + 생일 + 만기를 날짜별로 묶어서 반환
export async function getCalendarItems(
  rangeStart: Date,
  rangeEnd: Date,
  userId: string,
): Promise<Map<string, DayItem[]>> {
  const dayCount = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const days = eachDay(rangeStart, dayCount);

  const [events, customers, contracts, routineNotes, routineOverrides] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, status: "SCHEDULED", startAt: { gte: rangeStart, lte: rangeEnd } },
      include: { customer: true },
    }),
    prisma.customer.findMany({ where: { userId, birthDate: { not: null } } }),
    prisma.contract.findMany({
      where: { status: "ACTIVE", expiryDate: { gte: rangeStart, lte: rangeEnd }, customer: { userId } },
      include: { customer: true },
    }),
    prisma.studyNote.findMany({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { date: true, category: true },
    }),
    prisma.routineAttendance.findMany({
      where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
    }),
  ]);

  const meetingNoteDays = new Set(
    routineNotes.filter((n) => MEETING_CATEGORIES.includes(n.category)).map((n) => dateKey(n.date)),
  );
  const trainingNoteDays = new Set(
    routineNotes.filter((n) => TRAINING_CATEGORIES.includes(n.category)).map((n) => dateKey(n.date)),
  );
  const overrideByKey = new Map(
    routineOverrides.map((o) => [`${dateKey(o.date)}-${o.type}`, o.attended]),
  );
  function routineAttended(d: Date, type: "MEETING" | "TRAINING") {
    const key = `${dateKey(d)}-${type}`;
    if (overrideByKey.has(key)) return overrideByKey.get(key)!;
    return type === "MEETING" ? meetingNoteDays.has(dateKey(d)) : trainingNoteDays.has(dateKey(d));
  }

  const visitCustomerIds = Array.from(
    new Set(events.filter((e) => e.type === "VISIT" && e.customerId).map((e) => e.customerId as string)),
  );
  const visitSeqMap = await getVisitSequenceMap(visitCustomerIds, userId);

  const itemsByDay = new Map<string, DayItem[]>();
  const pushItem = (d: Date, item: DayItem) => {
    const k = dateKey(d);
    if (!itemsByDay.has(k)) itemsByDay.set(k, []);
    itemsByDay.get(k)!.push(item);
  };

  for (const d of days) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      pushItem(d, {
        key: `routine-meeting-${dateKey(d)}`,
        label: "09:40 정보미팅",
        type: "ROUTINE",
        attended: routineAttended(d, "MEETING"),
        routineDate: dateKey(d),
        routineType: "MEETING",
      });
      pushItem(d, {
        key: `routine-training-${dateKey(d)}`,
        label: "10:20 오전교육",
        type: "ROUTINE",
        attended: routineAttended(d, "TRAINING"),
        routineDate: dateKey(d),
        routineType: "TRAINING",
      });
    }
  }

  for (const e of events) {
    const type: DayItem["type"] = e.type === "VISIT" ? "VISIT" : e.type === "TRAINING" ? "TRAINING" : "CUSTOM";
    const seq = visitSeqMap.get(e.id);
    const label =
      type === "VISIT" && e.customer
        ? `${e.customer.name} ${seq ? `${seq}차` : ""}, ${formatTime(e.startAt)}${e.companion ? `, ${e.companion}동반` : ""}`
        : e.title;
    pushItem(e.startAt, {
      key: e.id,
      label,
      type,
      href: e.customerId ? `/customers/${e.customerId}` : undefined,
      eventId: e.id,
    });
  }

  for (const c of customers) {
    if (!c.birthDate) continue;
    const b = new Date(c.birthDate);
    for (const d of days) {
      if (d.getMonth() === b.getMonth() && d.getDate() === b.getDate()) {
        pushItem(d, {
          key: `bday-${c.id}-${dateKey(d)}`,
          label: `🎂 ${c.name} 생일`,
          type: "BIRTHDAY",
          href: `/customers/${c.id}`,
        });
      }
    }
  }

  for (const c of contracts) {
    if (!c.expiryDate) continue;
    pushItem(c.expiryDate, {
      key: `expiry-${c.id}`,
      label: `⏰ ${c.customer.name} ${c.productName} 만기`,
      type: "EXPIRY",
      href: `/customers/${c.customerId}`,
    });
  }

  return itemsByDay;
}
