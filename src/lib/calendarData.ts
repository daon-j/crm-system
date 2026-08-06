import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/format";
import { dateKey, type DayItem } from "@/lib/calendarTypes";

export type { DayItem };
export { dateKey, TYPE_STYLE, TYPE_DOT } from "@/lib/calendarTypes";

const MEETING_CATEGORIES = ["정보미팅", "MORNING_MEETING"];
const TRAINING_CATEGORIES = ["오전교육", "MORNING_TRAINING"];
const ROUTINE_TITLE: Record<"MEETING" | "TRAINING", string> = {
  MEETING: "정보미팅",
  TRAINING: "오전교육",
};

function eachDay(rangeStart: Date, dayCount: number): Date[] {
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// 평일마다 정보미팅(09:40)/오전교육(10:20)을 실제 CalendarEvent로 채워 넣는다.
// 이렇게 해야 방문·기타 일정처럼 개별 날짜 단위로 시간 변경/취소가 가능해진다.
// 이미 만들어진(취소된 것 포함) 날짜는 건드리지 않고 빠진 날짜만 채운다.
async function materializeRoutineEvents(rangeStart: Date, rangeEnd: Date, userId: string) {
  const existing = await prisma.calendarEvent.findMany({
    where: { userId, type: "ROUTINE", startAt: { gte: rangeStart, lte: rangeEnd } },
    select: { startAt: true, title: true },
  });
  const existingKeys = new Set(existing.map((e) => `${dateKey(e.startAt)}-${e.title}`));

  const dayCount = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const days = eachDay(rangeStart, dayCount);

  const toCreate: { userId: string; title: string; type: string; startAt: Date }[] = [];
  for (const d of days) {
    const day = d.getDay();
    if (day < 1 || day > 5) continue;
    const meetingAt = new Date(d);
    meetingAt.setHours(9, 40, 0, 0);
    const trainingAt = new Date(d);
    trainingAt.setHours(10, 20, 0, 0);
    if (!existingKeys.has(`${dateKey(d)}-${ROUTINE_TITLE.MEETING}`)) {
      toCreate.push({ userId, title: ROUTINE_TITLE.MEETING, type: "ROUTINE", startAt: meetingAt });
    }
    if (!existingKeys.has(`${dateKey(d)}-${ROUTINE_TITLE.TRAINING}`)) {
      toCreate.push({ userId, title: ROUTINE_TITLE.TRAINING, type: "ROUTINE", startAt: trainingAt });
    }
  }
  if (toCreate.length > 0) {
    await prisma.calendarEvent.createMany({ data: toCreate });
  }
}

// 고객별 VISIT 이벤트를 시간순으로 정렬해 몇 번째 방문인지(1차/2차/...) 매핑을 만든다.
// 완료 여부와 무관하게 예정된 방문도 포함해서 "이번이 몇 번째 만남인지"를 셈한다.
// customerIds로 범위를 좁히면 호출부가 그 목록을 먼저 구해야 해서(다른 쿼리 결과에 의존) 병렬 실행이 막히므로,
// 이 설계사의 예정 방문 전체를 한 번에 가져와 다른 대시보드 쿼리들과 나란히 돌 수 있게 한다.
export async function getVisitSequenceMap(userId: string): Promise<Map<string, number>> {
  const events = await prisma.calendarEvent.findMany({
    where: { userId, type: "VISIT", status: "SCHEDULED" },
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

// rangeStart~rangeEnd(포함) 사이의 방문/교육/루틴/기타 일정 + 생일 + 만기를 날짜별로 묶어서 반환
export async function getCalendarItems(
  rangeStart: Date,
  rangeEnd: Date,
  userId: string,
): Promise<Map<string, DayItem[]>> {
  await materializeRoutineEvents(rangeStart, rangeEnd, userId);

  const dayCount = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const days = eachDay(rangeStart, dayCount);

  const [events, customers, contracts, routineNotes, routineOverrides] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, status: "SCHEDULED", startAt: { gte: rangeStart, lte: rangeEnd } },
      include: { customer: true },
    }),
    prisma.customer.findMany({
      where: { userId, birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true },
    }),
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

  const visitSeqMap = await getVisitSequenceMap(userId);

  const itemsByDay = new Map<string, DayItem[]>();
  const pushItem = (d: Date, item: DayItem) => {
    const k = dateKey(d);
    if (!itemsByDay.has(k)) itemsByDay.set(k, []);
    itemsByDay.get(k)!.push(item);
  };

  for (const e of events) {
    if (e.type === "ROUTINE") {
      const routineType: "MEETING" | "TRAINING" = e.title === ROUTINE_TITLE.MEETING ? "MEETING" : "TRAINING";
      pushItem(e.startAt, {
        key: e.id,
        label: `${formatTime(e.startAt)} ${e.title}`,
        type: "ROUTINE",
        attended: routineAttended(e.startAt, routineType),
        routineDate: dateKey(e.startAt),
        routineType,
        eventId: e.id,
      });
      continue;
    }
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
      // 방문은 예정 시간이 지나면 자동으로 "완료된 방문"으로 취급 (고객상세 방문이력과 동일한 기준)
      attended: type === "VISIT" ? e.startAt <= new Date() : undefined,
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
