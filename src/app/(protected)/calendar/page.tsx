import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createEvent, setRoutineAttendance } from "@/lib/actions/calendar";
import { getCalendarItems, dateKey } from "@/lib/calendarData";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import QuickEventFields from "@/components/QuickEventFields";
import CalendarDayCell from "@/components/CalendarDayCell";
import CalendarViewToggle from "@/components/CalendarViewToggle";
import CancelEventButton from "@/components/CancelEventButton";
import { requireUser } from "@/lib/auth";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year, 10) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month, 10) - 1 : now.getMonth(); // 0-indexed

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridDays: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const gridEnd = gridDays[41];

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const [itemsByDay, customersRaw, recentContacts, currentMonthBatch] = await Promise.all([
    getCalendarItems(gridStart, gridEnd, user.id),
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(user.id),
    getCurrentMonthBatch(user.id),
  ]);
  const customers = customersRaw.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    batchName: c.batch?.name ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">
            {year}년 {month + 1}월
          </h1>
          <div className="flex gap-1">
            <Link
              href={`/calendar?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`}
              className="rounded-lg border border-border px-2.5 py-1 text-sm text-ink-2 hover:bg-surface-muted"
            >
              ◀
            </Link>
            <Link
              href={`/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth() + 1}`}
              className="rounded-lg border border-border px-2.5 py-1 text-sm text-ink-2 hover:bg-surface-muted"
            >
              ▶
            </Link>
          </div>
        </div>
        <Link
          href="/calendar/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + 새 일정 등록
        </Link>
      </div>

      <details className="mb-5">
        <summary className="cursor-pointer text-sm font-medium text-primary">
          + 일정 직접 추가 (빠른입력)
        </summary>
        <form
          action={createEvent}
          noValidate
          className="mt-3 flex flex-wrap gap-2 items-end rounded-xl border border-border bg-surface p-4"
        >
          <QuickEventFields
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatch.batchName}
            currentMonthLabel={currentMonthBatch.label}
          />
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            추가
          </button>
        </form>
      </details>

      {/* 데스크탑: 기존 점 표시 격자 그대로 유지 */}
      <div className="hidden lg:block rounded-xl border border-border bg-surface p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-medium text-ink-muted">
              {d}
            </div>
          ))}
          {gridDays.map((d) => {
            const key = dateKey(d);
            const items = itemsByDay.get(key) ?? [];
            const weekday = WEEKDAYS[d.getDay()];
            return (
              <CalendarDayCell
                key={key}
                dayNum={d.getDate()}
                label={`${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`}
                isToday={key === dateKey(now)}
                inMonth={d.getMonth() === month}
                items={items}
              />
            );
          })}
        </div>
      </div>
      <div className="hidden lg:flex mt-3 flex-wrap gap-3 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-success" />
          루틴 완료
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-info" />
          방문/일정
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-accent" />
          생일
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-danger" />
          만기
        </span>
        <span className="text-ink-muted">· 날짜를 탭하면 그날 일정이 펼쳐집니다</span>
      </div>

      {/* 모바일: 격자(텍스트)/목록 토글 */}
      <div className="lg:hidden">
        <CalendarViewToggle
          grid={
            <div className="rounded-xl border border-border bg-surface p-2">
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="pb-1 text-center text-[11px] font-medium text-ink-muted">
                    {d}
                  </div>
                ))}
                {gridDays.map((d) => {
                  const key = dateKey(d);
                  const items = itemsByDay.get(key) ?? [];
                  const weekday = WEEKDAYS[d.getDay()];
                  return (
                    <CalendarDayCell
                      key={key}
                      dayNum={d.getDate()}
                      label={`${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`}
                      isToday={key === dateKey(now)}
                      inMonth={d.getMonth() === month}
                      items={items}
                      dense
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2.5 text-[10px] text-ink-muted">
                <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full bg-info" />방문/일정</span>
                <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full bg-accent" />생일</span>
                <span className="inline-flex items-center gap-1"><span className="h-[6px] w-[6px] rounded-full bg-danger" />만기</span>
                <span>· 탭하면 자세히 보여요</span>
              </div>
            </div>
          }
          list={
            <div className="space-y-2">
              {gridDays
                .filter((d) => d.getMonth() === month)
                .map((d) => {
                  const key = dateKey(d);
                  const items = itemsByDay.get(key) ?? [];
                  const isToday = key === dateKey(now);
                  const weekday = WEEKDAYS[d.getDay()];
                  const routineItems = items.filter((i) => i.type === "ROUTINE");
                  const otherItems = items.filter((i) => i.type !== "ROUTINE");
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-3 ${isToday ? "border-info/30 bg-info-soft" : "border-border bg-surface"}`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday ? "bg-primary text-primary-ink" : "text-ink"
                          }`}
                        >
                          {d.getDate()}
                        </span>
                        <span className="text-xs text-ink-muted">{weekday}요일</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-xs text-ink-muted">일정 없음</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {routineItems.map((r) => (
                            <div key={r.key} className="flex items-center gap-1.5">
                              <form
                                action={setRoutineAttendance.bind(null, r.routineDate!, r.routineType!, !r.attended)}
                                className="min-w-0 flex-1"
                              >
                                <button
                                  type="submit"
                                  className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium ${
                                    r.attended ? "bg-success-soft text-success line-through" : "bg-surface-muted text-ink-muted"
                                  }`}
                                >
                                  {r.attended ? "✓ " : ""}
                                  {r.label}
                                </button>
                              </form>
                              {r.eventId && (
                                <>
                                  <Link
                                    href={`/calendar/${r.eventId}/edit`}
                                    className="shrink-0 rounded-lg border border-border px-1.5 py-1 text-[11px] text-primary"
                                  >
                                    ✏️
                                  </Link>
                                  <CancelEventButton
                                    eventId={r.eventId}
                                    className="shrink-0 rounded-lg border border-border px-1.5 py-1 text-[11px] text-ink-muted hover:text-danger"
                                  />
                                </>
                              )}
                            </div>
                          ))}
                          {otherItems.map((item) => {
                            const visitDone = item.type === "VISIT" && item.attended;
                            const content = (
                              <span
                                className={`block rounded-lg px-2 py-1.5 text-xs ${
                                  visitDone
                                    ? "bg-success-soft text-success"
                                    : item.type === "VISIT"
                                      ? "bg-info-soft text-info"
                                      : item.type === "BIRTHDAY"
                                        ? "bg-accent-soft text-accent"
                                        : item.type === "EXPIRY"
                                          ? "bg-danger-soft text-danger"
                                          : "bg-primary/10 text-primary"
                                }`}
                              >
                                {visitDone ? "✓ " : ""}
                                {item.label}
                              </span>
                            );
                            return (
                              <div key={item.key} className="flex items-center gap-1.5">
                                {item.href ? (
                                  <Link href={item.href} className="min-w-0 flex-1">
                                    {content}
                                  </Link>
                                ) : (
                                  <div className="min-w-0 flex-1">{content}</div>
                                )}
                                {item.eventId && (
                                  <>
                                    <Link
                                      href={`/calendar/${item.eventId}/edit`}
                                      className="shrink-0 rounded-lg border border-border px-1.5 py-1 text-[11px] text-primary"
                                    >
                                      ✏️
                                    </Link>
                                    <CancelEventButton
                                      eventId={item.eventId}
                                      className="shrink-0 rounded-lg border border-border px-1.5 py-1 text-[11px] text-ink-muted hover:text-danger"
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          }
        />
      </div>
    </div>
  );
}
