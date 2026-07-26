import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createEvent } from "@/lib/actions/calendar";
import { getCalendarItems, dateKey, TYPE_STYLE } from "@/lib/calendarData";
import { getRecentContacts } from "@/lib/recentContacts";
import { getCurrentMonthBatch } from "@/lib/currentMonthBatch";
import QuickEventFields from "@/components/QuickEventFields";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
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
    getCalendarItems(gridStart, gridEnd),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, batch: { select: { name: true } } },
    }),
    getRecentContacts(),
    getCurrentMonthBatch(),
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
          <h1 className="text-2xl font-bold text-slate-900">
            {year}년 {month + 1}월
          </h1>
          <div className="flex gap-1">
            <Link
              href={`/calendar?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              ◀
            </Link>
            <Link
              href={`/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth() + 1}`}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              ▶
            </Link>
          </div>
        </div>
        <Link
          href="/calendar/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 새 일정 등록
        </Link>
      </div>

      <details className="mb-5">
        <summary className="cursor-pointer text-sm font-medium text-blue-600">
          + 일정 직접 추가 (빠른입력)
        </summary>
        <form
          action={createEvent}
          noValidate
          className="mt-3 flex flex-wrap gap-2 items-end rounded-xl border border-slate-200 bg-white p-4"
        >
          <QuickEventFields
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatch.batchName}
            currentMonthLabel={currentMonthBatch.label}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            추가
          </button>
        </form>
      </details>

      <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-px rounded-xl border border-slate-200 bg-slate-200 overflow-hidden text-sm min-w-[700px]">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-medium text-slate-500">
            {d}
          </div>
        ))}
        {gridDays.map((d) => {
          const inMonth = d.getMonth() === month;
          const isToday = dateKey(d) === dateKey(now);
          const items = itemsByDay.get(dateKey(d)) ?? [];
          return (
            <div
              key={dateKey(d)}
              className={`min-h-[110px] bg-white p-1.5 ${inMonth ? "" : "bg-slate-50/60"}`}
            >
              <div
                className={`text-xs mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  isToday ? "bg-blue-600 text-white font-semibold" : "text-slate-400"
                }`}
              >
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const content = (
                    <span
                      className={`block truncate rounded px-1 py-0.5 text-[11px] ${TYPE_STYLE[item.type]}`}
                    >
                      {item.label}
                    </span>
                  );
                  return (
                    <div key={item.key} className="group relative">
                      {item.href ? <Link href={item.href}>{content}</Link> : content}
                      {item.eventId && (
                        <Link
                          href={`/calendar/${item.eventId}/edit`}
                          className="hidden group-hover:flex absolute right-0 top-0 rounded bg-white shadow-sm border border-slate-200 px-1 py-0.5 text-[10px] text-blue-600 hover:text-blue-800"
                          title="수정 · 취소"
                        >
                          ✏️
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
