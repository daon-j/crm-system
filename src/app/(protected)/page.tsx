import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatPhone } from "@/lib/format";
import { getCalendarItems, getVisitSequenceMap, dateKey, TYPE_STYLE } from "@/lib/calendarData";
import { createTodo, toggleTodo, deleteTodo } from "@/lib/actions/todos";
import { setRoutineAttendance } from "@/lib/actions/calendar";
import { getDashboardLayout, type DashboardSectionKey } from "@/lib/dashboardLayout";
import { requireUser } from "@/lib/auth";
import VisitPrepModal from "@/components/VisitPrepModal";

const TYPE_PRIORITY: Record<string, number> = {
  VISIT: 0,
  TRAINING: 1,
  EXPIRY: 2,
  BIRTHDAY: 3,
  CUSTOM: 4,
  ROUTINE: 5,
};

const TODO_PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const TODO_PRIORITY_LABEL: Record<string, string> = { HIGH: "높음", MEDIUM: "보통", LOW: "낮음" };
const TODO_PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-slate-100 text-slate-500",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    mobileConsentCount,
    allBatches,
    allTodos,
    gradeGroups,
    pendingMessages,
    pendingMessageCount,
    todayVisits,
    upcomingVisits,
    allCustomersWithBirthday,
    callTargets,
    contractsByCategory,
    newContractsThisMonth,
    layout,
  ] = await Promise.all([
    prisma.customer.count({ where: { userId: user.id } }),
    prisma.customer.count({ where: { userId: user.id, mobileConsent: true } }),
    prisma.customerBatch.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
    prisma.todo.findMany({ where: { userId: user.id } }),
    prisma.customer.groupBy({ by: ["grade"], where: { userId: user.id }, _count: true }),
    prisma.message.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { customer: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.message.count({ where: { userId: user.id, status: "PENDING" } }),
    prisma.calendarEvent.findMany({
      where: { userId: user.id, type: "VISIT", status: "SCHEDULED", startAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { startAt: "asc" },
      include: {
        customer: {
          include: {
            contracts: { where: { status: "ACTIVE" } },
            consultations: { orderBy: { createdAt: "desc" }, take: 1 },
            referrals: { select: { id: true } },
          },
        },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId: user.id, type: "VISIT", status: "SCHEDULED", startAt: { gt: todayEnd } },
      orderBy: { startAt: "asc" },
      take: 10,
      include: {
        customer: {
          include: {
            contracts: { where: { status: "ACTIVE" } },
            referrals: { select: { id: true } },
          },
        },
      },
    }),
    prisma.customer.findMany({ where: { userId: user.id, birthDate: { not: null } } }),
    prisma.consultation.findMany({
      where: { nextContactDate: { gte: todayStart, lt: todayEnd }, customer: { userId: user.id } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contract.groupBy({
      by: ["category"],
      where: { status: "ACTIVE", customer: { userId: user.id } },
      _count: true,
    }),
    prisma.contract.count({
      where: { source: "AGENT_SALE", joinDate: { gte: monthStart }, customer: { userId: user.id } },
    }),
    getDashboardLayout(user.id),
  ]);

  // "이번달"은 등록일(createdAt) 기준이 아니라, 이번달에 회사에서 받은 고객DB 배치(예: "2026년 7월DB") 기준
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthLabel = `${currentMonthNum}월DB`;
  const currentMonthPattern = new RegExp(`^${now.getFullYear()}\\s*년\\s*${currentMonthNum}\\s*월`);
  const currentMonthBatchIds = allBatches.filter((b) => currentMonthPattern.test(b.name)).map((b) => b.id);
  const [customersThisMonth, mobileConsentThisMonth] =
    currentMonthBatchIds.length > 0
      ? await Promise.all([
          prisma.customer.count({ where: { userId: user.id, batchId: { in: currentMonthBatchIds } } }),
          prisma.customer.count({
            where: { userId: user.id, batchId: { in: currentMonthBatchIds }, mobileConsent: true },
          }),
        ])
      : [0, 0];

  const todos = allTodos.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const diff = TODO_PRIORITY_ORDER[a.priority] - TODO_PRIORITY_ORDER[b.priority];
    if (diff !== 0) return diff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const visitSeqMap = await getVisitSequenceMap(
    Array.from(
      new Set(
        [...todayVisits, ...upcomingVisits]
          .map((e) => e.customerId)
          .filter((id): id is string => !!id),
      ),
    ),
    user.id,
  );

  const todayBirthdays = allCustomersWithBirthday.filter((c) => {
    const b = new Date(c.birthDate!);
    return b.getMonth() === now.getMonth() && b.getDate() === now.getDate();
  });

  const seen = new Set<string>();
  const uniqueCallTargets = callTargets.filter((c) => {
    if (seen.has(c.customerId)) return false;
    seen.add(c.customerId);
    return true;
  });

  const gradeMap = Object.fromEntries(gradeGroups.map((g) => [g.grade, g._count]));

  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const miniStart = new Date(thisWeekStart);
  miniStart.setDate(miniStart.getDate() - 7);
  const miniDays = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(miniStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const miniEnd = miniDays[20];
  const miniItemsByDay = await getCalendarItems(miniStart, miniEnd, user.id);
  const weekRows = [
    { label: "지난주", days: miniDays.slice(0, 7) },
    { label: "이번주", days: miniDays.slice(7, 14) },
    { label: "다음주", days: miniDays.slice(14, 21) },
  ];

  const sections: Record<DashboardSectionKey, ReactNode> = {
    todayVisits:
      todayVisits.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚗</span>
            <h2 className="text-lg font-bold text-slate-900">오늘의 방문 {todayVisits.length}건</h2>
          </div>
          {todayVisits.map((e) => {
            const customer = e.customer;
            const latestConsultation = customer?.consultations[0];
            const seq = visitSeqMap.get(e.id);
            const hasContract = !!customer && customer.contracts.some((c) => c.source === "AGENT_SALE");
            const hasReferred = !!customer && customer.referrals.length > 0;
            const prepItems = (e.prepNote ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div key={e.id} className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-bold text-blue-700">{formatTime(e.startAt)}</span>
                      {customer ? (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-lg font-semibold text-slate-900 hover:underline"
                        >
                          {customer.name} 고객
                        </Link>
                      ) : (
                        <span className="text-lg font-semibold text-slate-900">{e.title}</span>
                      )}
                      {customer && (
                        <span className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-slate-500">
                          {customer.grade}등급
                        </span>
                      )}
                      {seq && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-bold text-sky-700">
                          방문{seq}차
                        </span>
                      )}
                      {hasContract && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                          체결고객
                        </span>
                      )}
                      {hasReferred && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                          소개왕
                        </span>
                      )}
                    </div>
                    {customer && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatPhone(customer.phone)}
                        {customer.address ? ` · ${customer.address}` : ""}
                      </p>
                    )}
                    {(e.area || e.companion) && (
                      <div className="flex gap-1.5 mt-1.5">
                        {e.area && (
                          <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                            📍 {e.area}
                          </span>
                        )}
                        {e.companion && (
                          <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                            👥 {e.companion} 동반
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {customer && (
                      <VisitPrepModal
                        customerName={customer.name}
                        seq={seq}
                        phone={formatPhone(customer.phone)}
                        address={customer.address ?? "-"}
                        products={customer.contracts.map((c) => c.productName)}
                        mobileConsentText={customer.mobileConsent ? "동의함" : "동의안함"}
                        visitNote={e.prepNote}
                      />
                    )}
                    <Link
                      href={`/calendar/${e.id}/edit`}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline whitespace-nowrap"
                    >
                      일정 변경
                    </Link>
                  </div>
                </div>

                {e.memo && (
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="text-slate-400">방문목적 · </span>
                    {e.memo}
                  </p>
                )}

                {prepItems.length > 0 && (
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="text-slate-400">준비물 · </span>
                    {prepItems.join(", ")}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="text-slate-400">가입상품 · </span>
                    {customer && customer.contracts.length > 0
                      ? customer.contracts.map((c) => c.productName).join(", ")
                      : "없음"}
                  </div>
                  <div>
                    <span className="text-slate-400">최근 상담 · </span>
                    {latestConsultation
                      ? `${formatDate(latestConsultation.createdAt)} ${latestConsultation.content}`
                      : "이력 없음"}
                  </div>
                </div>

                {customer?.memo && (
                  <p className="mt-2 text-xs text-slate-400">💬 {customer.memo}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 flex items-center gap-2">
          <span className="text-slate-400">🚗</span>
          <p className="text-sm text-slate-500">오늘 예정된 방문이 없습니다</p>
        </div>
      ),

    quickActions: (
      <div className="flex flex-wrap gap-2">
        <QuickAction href="/calendar/new" icon="📅" label="방문 일정 잡기" />
        <QuickAction href="/calls" icon="📞" label="콜 상담 기록하기" />
        <QuickAction href="/messages/new" icon="💬" label="문자 발송하기" />
        <QuickAction href="/notes" icon="📖" label="학습노트 작성" />
      </div>
    ),

    todos: (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">오늘 할일</h2>
        <form action={createTodo} className="flex gap-2 mb-3">
          <input
            type="text"
            name="content"
            required
            placeholder="할일을 입력하세요"
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          >
            <option value="HIGH">중요도: 높음</option>
            <option value="MEDIUM">중요도: 보통</option>
            <option value="LOW">중요도: 낮음</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 whitespace-nowrap"
          >
            추가
          </button>
        </form>
        <div className="space-y-1.5">
          {todos.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm ${
                t.done ? "bg-slate-50" : "border border-slate-100"
              }`}
            >
              <form action={toggleTodo.bind(null, t.id)}>
                <input type="hidden" name="done" value={String(t.done)} />
                <button
                  type="submit"
                  aria-label={t.done ? "완료 취소" : "완료 처리"}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                    t.done
                      ? "border-slate-300 bg-slate-300 text-white"
                      : "border-slate-300 hover:border-blue-400"
                  }`}
                >
                  {t.done && "✓"}
                </button>
              </form>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${TODO_PRIORITY_STYLE[t.priority]}`}
              >
                {TODO_PRIORITY_LABEL[t.priority]}
              </span>
              <span className={`flex-1 ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                {t.content}
              </span>
              <form action={deleteTodo.bind(null, t.id)}>
                <button type="submit" aria-label="삭제" className="text-xs text-slate-300 hover:text-red-600">
                  ✕
                </button>
              </form>
            </div>
          ))}
          {todos.length === 0 && <p className="text-sm text-slate-400 py-1">등록된 할일이 없습니다</p>}
        </div>
      </div>
    ),

    upcomingVisits: upcomingVisits.length > 0 ? (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">다가오는 방문예약</h2>
        <div className="space-y-2">
          {upcomingVisits.map((e) => {
            const customer = e.customer;
            const seq = visitSeqMap.get(e.id);
            const hasContract = !!customer && customer.contracts.some((c) => c.source === "AGENT_SALE");
            const hasReferred = !!customer && customer.referrals.length > 0;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm hover:bg-slate-100"
              >
                <Link
                  href={e.customerId ? `/customers/${e.customerId}` : "/calendar"}
                  className="flex items-center gap-2 flex-wrap flex-1 min-w-0"
                >
                  <span className="font-medium text-blue-700 whitespace-nowrap">
                    {e.startAt.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })}{" "}
                    {formatTime(e.startAt)}
                  </span>
                  <span className="font-medium text-slate-800">{customer?.name ?? e.title}</span>
                  {seq && (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-bold text-sky-700">
                      방문{seq}차
                    </span>
                  )}
                  {hasContract && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      체결고객
                    </span>
                  )}
                  {hasReferred && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                      소개왕
                    </span>
                  )}
                  {e.companion && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                      👥 {e.companion} 동반
                    </span>
                  )}
                </Link>
                <span className="text-slate-400 text-xs whitespace-nowrap">
                  {e.area ? `${e.area} · ` : ""}
                  {customer?.address ?? ""}
                </span>
                <div className="shrink-0 flex items-center gap-2.5 whitespace-nowrap">
                  {customer && (
                    <VisitPrepModal
                      customerName={customer.name}
                      seq={seq}
                      phone={formatPhone(customer.phone)}
                      address={customer.address ?? "-"}
                      products={customer.contracts.map((c) => c.productName)}
                      mobileConsentText={customer.mobileConsent ? "동의함" : "동의안함"}
                      visitNote={e.prepNote}
                      triggerLabel="준비물"
                      triggerClassName="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline"
                    />
                  )}
                  <Link
                    href={`/calendar/${e.id}/edit`}
                    className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline"
                  >
                    수정
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null,

    miniCalendar: (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">일정 (지난주 · 이번주 · 다음주)</h2>
          <Link href="/calendar" className="text-xs font-medium text-blue-600 hover:underline">
            캘린더 전체보기 →
          </Link>
        </div>
        <div className="flex gap-2 mb-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> 방문
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> 교육
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-pink-500" /> 생일
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> 만기
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> 정보미팅·오전교육 (탭해서 참석 체크)
          </span>
        </div>
        <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-200 overflow-hidden text-sm min-w-[560px]">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} className="bg-slate-50 px-1 py-1.5 text-center text-xs font-medium text-slate-500">
              {d}
            </div>
          ))}
          {weekRows.map((week) => (
            <Fragment key={week.label}>
              {week.days.map((d) => {
                const isToday = dateKey(d) === dateKey(now);
                const isCurrentWeek = week.label === "이번주";
                const dayItems = miniItemsByDay.get(dateKey(d)) ?? [];
                // 정보미팅/오전교육은 항상 노출(전체 캘린더와 동일하게 매일 탭 가능해야 함). 나머지 일정만 상위 2개로 제한.
                const routineItems = dayItems.filter((i) => i.type === "ROUTINE");
                const otherItems = dayItems
                  .filter((i) => i.type !== "ROUTINE")
                  .sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]);
                const visibleOtherItems = otherItems.slice(0, 2);
                const extraCount = otherItems.length - visibleOtherItems.length;
                const visibleItems = [...visibleOtherItems, ...routineItems];
                const hasVisit = otherItems.some((i) => i.type === "VISIT");
                return (
                  <div
                    key={dateKey(d)}
                    className={`min-h-[64px] p-1 ${isCurrentWeek ? "bg-indigo-50" : "bg-white"} ${isToday ? "ring-2 ring-inset ring-blue-500" : ""} ${hasVisit ? "bg-blue-50/60" : ""}`}
                  >
                    <div className={`text-[11px] mb-0.5 ${isToday ? "font-bold text-blue-600" : "text-slate-400"}`}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {visibleItems.map((item) => {
                        if (item.type === "ROUTINE") {
                          return (
                            <form
                              key={item.key}
                              action={setRoutineAttendance.bind(null, item.routineDate!, item.routineType!, !item.attended)}
                            >
                              <button
                                type="submit"
                                className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] ${
                                  item.attended ? "bg-emerald-100 text-emerald-700 line-through" : TYPE_STYLE[item.type]
                                }`}
                              >
                                {item.attended ? "✓ " : ""}
                                {item.label}
                              </button>
                            </form>
                          );
                        }
                        const chip = (
                          <span className={`block truncate rounded px-1 py-0.5 text-[10px] ${TYPE_STYLE[item.type]}`}>
                            {item.label}
                          </span>
                        );
                        return item.href ? (
                          <Link key={item.key} href={item.href}>
                            {chip}
                          </Link>
                        ) : (
                          <div key={item.key}>{chip}</div>
                        );
                      })}
                      {extraCount > 0 && <span className="text-[10px] text-slate-400">+{extraCount}</span>}
                    </div>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
        </div>
      </div>
    ),

    statCards: (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="총 고객수"
          value={`${totalCustomers}명`}
          sub={`(${currentMonthLabel} ${customersThisMonth}명)`}
          href="/customers"
        />
        <StatCard label="오늘 콜 대상" value={`${uniqueCallTargets.length}건`} href="/calls" />
        <StatCard label="발송대기 문자" value={`${pendingMessageCount}건`} href="/messages" />
        <StatCard label="오늘 생일" value={`${todayBirthdays.length}명`} href="/customers" />
        <StatCard
          label="모바일동의"
          value={`${mobileConsentCount}/${totalCustomers}명`}
          sub={`(${currentMonthLabel} ${mobileConsentThisMonth}/${customersThisMonth}명)`}
          href="/customers"
        />
      </div>
    ),

    threeColumnGrid: (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardSection title="오늘 콜 대상" href="/calls" linkLabel="콜 상담하러 가기">
          {uniqueCallTargets.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.customerId}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">{c.customer.name}</span>
              <span className="text-slate-400 text-xs">{formatPhone(c.customer.phone)}</span>
            </Link>
          ))}
          {uniqueCallTargets.length === 0 && <EmptyRow text="오늘 재접촉 예정인 고객이 없습니다" />}
        </DashboardSection>

        <DashboardSection title="발송대기 문자" href="/messages" linkLabel="문자함 전체 보기">
          {pendingMessages.map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                <span className="font-medium text-slate-700">{m.customer.name}</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{m.triggerType}</span>
              </div>
              <p className="text-slate-600 truncate">{m.content}</p>
            </div>
          ))}
          {pendingMessages.length === 0 && <EmptyRow text="발송 대기중인 문자가 없습니다" />}
        </DashboardSection>

        <DashboardSection title="오늘 생일 고객" href="/customers" linkLabel="고객관리 보기">
          {todayBirthdays.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between rounded-lg bg-pink-50 px-3.5 py-2.5 text-sm hover:bg-pink-100"
            >
              <span className="font-medium text-slate-800">🎂 {c.name}</span>
              <span className="text-slate-400 text-xs">{formatPhone(c.phone)}</span>
            </Link>
          ))}
          {todayBirthdays.length === 0 && <EmptyRow text="오늘 생일인 고객이 없습니다" />}
        </DashboardSection>
      </div>
    ),

    bottomStats: (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">통계</h2>
        <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-400 mb-1.5">등급별 고객</p>
            <p className="text-slate-700">
              A {gradeMap.A ?? 0}명 · B {gradeMap.B ?? 0}명 · C {gradeMap.C ?? 0}명
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1.5">보험종류별 유지계약</p>
            <p className="text-slate-700">
              {contractsByCategory.map((c) => `${c.category} ${c._count}건`).join(" · ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 mb-1.5">이번달 신규계약</p>
            <p className="text-slate-700">{newContractsThisMonth}건</p>
          </div>
        </div>
      </div>
    ),
  };

  const visibleOrder = layout.order.filter((key) => !layout.hidden.includes(key));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
      </h1>
      <p className="text-sm text-slate-500 mb-6">오늘 확인할 항목을 한눈에 보세요.</p>

      {/* 사용자가 설정 페이지에서 순서/표시여부를 조정할 수 있는 섹션들 */}
      <div className="space-y-8">
        {visibleOrder.map((key) => (
          <Fragment key={key}>{sections[key]}</Fragment>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-colors"
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">
        {value}
        {sub && <span className="ml-1 text-xs font-normal text-slate-400">{sub}</span>}
      </p>
    </Link>
  );
}

function DashboardSection({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link href={href} className="text-xs font-medium text-blue-600 hover:underline">
          {linkLabel} →
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 py-2">{text}</p>;
}
