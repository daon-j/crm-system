import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatPhone } from "@/lib/format";
import { getCalendarItems, getVisitSequenceMap, dateKey } from "@/lib/calendarData";
import { createTodo, toggleTodo, deleteTodo } from "@/lib/actions/todos";
import { getDashboardLayout, type DashboardSectionKey } from "@/lib/dashboardLayout";
import { requireUser } from "@/lib/auth";
import VisitPrepModal from "@/components/VisitPrepModal";
import CalendarDayCell from "@/components/CalendarDayCell";
import CancelEventButton from "@/components/CancelEventButton";
import { getEnergeticGreeting } from "@/lib/greeting";

const TODO_PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const TODO_PRIORITY_LABEL: Record<string, string> = { HIGH: "높음", MEDIUM: "보통", LOW: "낮음" };
const TODO_PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-danger-soft text-danger",
  MEDIUM: "bg-accent-soft text-accent",
  LOW: "bg-surface-muted text-ink-muted",
};
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // now에서만 계산되고 다른 쿼리 결과에 의존하지 않으므로, 아래 메인 배치보다 먼저 정해둔다 -
  // 그래야 미니 캘린더 조회(getCalendarItems)를 메인 배치와 동시에 시작할 수 있다.
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const miniStart = new Date(thisWeekStart);
  miniStart.setDate(miniStart.getDate() - 7);
  const miniDays = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(miniStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const miniEnd = miniDays[20];

  // 예전에는 이 메인 배치가 끝난 뒤에 visitSeqMap 조회 → materializeRoutineEvents →
  // 미니캘린더 조회가 순서대로(직렬로) 이어져서 원격 DB 왕복이 여러 번 누적됐다.
  // 서로 결과에 의존하지 않는 두 작업(메인 배치 / 미니캘린더 조회)을 Promise.all로 묶어 동시에 실행한다.
  const [
    [
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
      visitSeqMap,
    ],
    miniItemsByDay,
  ] = await Promise.all([
    Promise.all([
      prisma.customer.count({ where: { userId: user.id } }),
      prisma.customer.count({ where: { userId: user.id, mobileConsent: true } }),
      prisma.customerBatch.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
      prisma.todo.findMany({ where: { userId: user.id } }),
      prisma.customer.groupBy({ by: ["grade"], where: { userId: user.id }, _count: true }),
      prisma.message.findMany({
        where: { userId: user.id, status: "PENDING" },
        include: { customer: { select: { name: true } } },
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
      prisma.customer.findMany({
        where: { userId: user.id, birthDate: { not: null } },
        select: { id: true, name: true, phone: true, birthDate: true },
      }),
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
      getVisitSequenceMap(user.id),
    ]),
    getCalendarItems(miniStart, miniEnd, user.id),
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

  const sections: Record<DashboardSectionKey, ReactNode> = {
    todayVisits:
      todayVisits.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚗</span>
            <h2 className="text-lg font-bold text-ink">오늘의 방문 {todayVisits.length}건</h2>
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
              <div key={e.id} className="rounded-xl border border-border border-l-4 border-l-info bg-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-bold text-info">{formatTime(e.startAt)}</span>
                      {customer ? (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-lg font-semibold text-ink hover:underline"
                        >
                          {customer.name} 고객
                        </Link>
                      ) : (
                        <span className="text-lg font-semibold text-ink">{e.title}</span>
                      )}
                      {customer && (
                        <span className="text-xs font-medium text-ink-muted">{customer.grade}등급</span>
                      )}
                      {seq && (
                        <span className="rounded bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info">
                          방문{seq}차
                        </span>
                      )}
                      {hasContract && (
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-xs font-medium text-success">
                          체결고객
                        </span>
                      )}
                      {hasReferred && (
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                          소개왕
                        </span>
                      )}
                    </div>
                    {customer && (
                      <p className="text-sm text-ink-muted mt-0.5">
                        {formatPhone(customer.phone)}
                        {customer.address ? ` · ${customer.address}` : ""}
                      </p>
                    )}
                    {(e.area || e.companion) && (
                      <div className="flex gap-1.5 mt-1.5">
                        {e.area && (
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                            📍 {e.area}
                          </span>
                        )}
                        {e.companion && (
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
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
                      href={`/calendar/${e.id}/edit?from=%2F`}
                      className="text-xs font-medium text-ink-muted hover:text-primary hover:underline whitespace-nowrap"
                    >
                      일정 변경
                    </Link>
                    <CancelEventButton
                      eventId={e.id}
                      returnTo="/"
                      className="text-xs font-medium text-ink-muted hover:text-danger hover:underline whitespace-nowrap"
                    />
                  </div>
                </div>

                {e.memo && (
                  <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-2">
                    <span className="text-ink-muted">방문목적 · </span>
                    {e.memo}
                  </p>
                )}

                {prepItems.length > 0 && (
                  <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-2">
                    <span className="text-ink-muted">준비물 · </span>
                    {prepItems.join(", ")}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-ink-2 sm:grid-cols-2">
                  <div>
                    <span className="text-ink-muted">가입상품 · </span>
                    {customer && customer.contracts.length > 0
                      ? customer.contracts.map((c) => c.productName).join(", ")
                      : "없음"}
                  </div>
                  <div>
                    <span className="text-ink-muted">최근 상담 · </span>
                    {latestConsultation
                      ? `${formatDate(latestConsultation.createdAt)} ${latestConsultation.content}`
                      : "이력 없음"}
                  </div>
                </div>

                {customer?.memo && (
                  <p className="mt-2 text-xs text-ink-muted">💬 {customer.memo}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* 모바일: 빈 상태를 다음 행동으로 이어주는 화면 */}
          <div className="lg:hidden">
            {uniqueCallTargets.length > 0 ? (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-bold text-ink mb-3">
                  오늘 방문은 없지만, 콜 대상 {uniqueCallTargets.length}명이 있어요
                </p>
                <div className="space-y-0.5">
                  {uniqueCallTargets.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-t border-border py-2 text-sm first:border-t-0">
                      <span className="font-medium text-ink">{c.customer.name}</span>
                      <span className="text-xs text-ink-muted">{formatPhone(c.customer.phone)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/calls" className="mt-2 inline-block text-xs font-bold text-primary">
                  전체 콜 대상 보기 →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-5 text-center">
                <p className="text-base mb-1">🌤️</p>
                <p className="text-sm font-bold text-ink mb-1">오늘은 방문이 없어요</p>
                <p className="text-xs text-ink-2 leading-relaxed mb-3">
                  방문은 곧 다시 채워질 거예요. 지금 할 수 있는 일부터 해볼까요?
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/calls" className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white">
                    콜 상담 바로가기
                  </Link>
                  <Link
                    href="/calendar/new?title=보장분석"
                    className="rounded-lg border border-primary px-3.5 py-2 text-xs font-bold text-primary"
                  >
                    보장분석/설계해보기
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 데스크탑: 기존 문구 그대로 유지 */}
          <div className="hidden lg:flex rounded-xl border border-border bg-surface-muted px-5 py-4 items-center gap-2">
            <span className="text-ink-muted">🚗</span>
            <p className="text-sm text-ink-muted">오늘 예정된 방문이 없습니다</p>
          </div>
        </>
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
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">오늘 할일</h2>
        <form action={createTodo} className="flex gap-2 mb-3">
          <input
            type="text"
            name="content"
            required
            placeholder="할일을 입력하세요"
            className="flex-1 rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="rounded-lg border border-border px-2.5 py-2 text-sm"
          >
            <option value="HIGH">중요도: 높음</option>
            <option value="MEDIUM">중요도: 보통</option>
            <option value="LOW">중요도: 낮음</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-ink-ink hover:opacity-90 whitespace-nowrap"
          >
            추가
          </button>
        </form>
        <div className="space-y-1.5">
          {todos.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm ${
                t.done ? "bg-surface-muted" : "border border-border"
              }`}
            >
              <form action={toggleTodo.bind(null, t.id)}>
                <input type="hidden" name="done" value={String(t.done)} />
                <button
                  type="submit"
                  aria-label={t.done ? "완료 취소" : "완료 처리"}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                    t.done
                      ? "border-success bg-success text-success-ink"
                      : "border-border hover:border-primary"
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
              <span className={`flex-1 ${t.done ? "text-ink-muted line-through" : "text-ink-2"}`}>
                {t.content}
              </span>
              <form action={deleteTodo.bind(null, t.id)}>
                <button type="submit" aria-label="삭제" className="text-xs text-ink-muted hover:text-danger">
                  ✕
                </button>
              </form>
            </div>
          ))}
          {todos.length === 0 && <p className="text-sm text-ink-muted py-1">등록된 할일이 없습니다</p>}
        </div>
      </div>
    ),

    upcomingVisits: upcomingVisits.length > 0 ? (
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">다가오는 방문예약</h2>

        {/* 모바일: 두 줄로 나눠 쌓는 레이아웃 (좁은 화면에서 글자 세로깨짐 방지) */}
        <div className="lg:hidden space-y-2">
          {upcomingVisits.map((e) => {
            const customer = e.customer;
            const seq = visitSeqMap.get(e.id);
            const hasContract = !!customer && customer.contracts.some((c) => c.source === "AGENT_SALE");
            const hasReferred = !!customer && customer.referrals.length > 0;
            return (
              <div key={e.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">
                    {e.startAt.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })}{" "}
                    {formatTime(e.startAt)}
                  </span>
                  <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-muted">
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
                        triggerClassName="text-xs font-medium text-accent"
                      />
                    )}
                    <Link href={`/calendar/${e.id}/edit?from=%2F`}>수정</Link>
                    <CancelEventButton eventId={e.id} returnTo="/" className="text-xs font-medium text-ink-muted hover:text-danger" />
                  </div>
                </div>
                <Link
                  href={e.customerId ? `/customers/${e.customerId}` : "/calendar"}
                  className="mt-1.5 block text-sm font-semibold text-ink"
                >
                  {customer?.name ?? e.title}
                  {seq && <span className="ml-1.5 text-xs font-medium text-ink-muted">방문{seq}차</span>}
                </Link>
                {(e.area || customer?.address) && (
                  <p className="mt-1 text-xs text-ink-2">
                    📍 {e.area ? `${e.area} · ` : ""}
                    {customer?.address ?? ""}
                  </p>
                )}
                {e.companion && <p className="mt-0.5 text-xs text-ink-muted">👥 {e.companion} 동반</p>}
                {(hasContract || hasReferred) && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {hasContract && (
                      <span className="rounded bg-success-soft px-1.5 py-0.5 text-[11px] font-medium text-success">
                        체결고객
                      </span>
                    )}
                    {hasReferred && (
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                        소개왕
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 데스크탑: 기존 한 줄 레이아웃 그대로 유지 */}
        <div className="hidden lg:block space-y-2">
          {upcomingVisits.map((e) => {
            const customer = e.customer;
            const seq = visitSeqMap.get(e.id);
            const hasContract = !!customer && customer.contracts.some((c) => c.source === "AGENT_SALE");
            const hasReferred = !!customer && customer.referrals.length > 0;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm hover:bg-border/40"
              >
                <Link
                  href={e.customerId ? `/customers/${e.customerId}` : "/calendar"}
                  className="flex items-center gap-2 flex-wrap flex-1 min-w-0"
                >
                  <span className="font-medium text-primary whitespace-nowrap">
                    {e.startAt.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })}{" "}
                    {formatTime(e.startAt)}
                  </span>
                  <span className="font-medium text-ink">{customer?.name ?? e.title}</span>
                  {seq && (
                    <span className="rounded bg-info-soft px-1.5 py-0.5 text-[11px] font-bold text-info">
                      방문{seq}차
                    </span>
                  )}
                  {hasContract && (
                    <span className="rounded bg-success-soft px-1.5 py-0.5 text-[11px] font-medium text-success">
                      체결고객
                    </span>
                  )}
                  {hasReferred && (
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                      소개왕
                    </span>
                  )}
                  {e.companion && (
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-muted">
                      👥 {e.companion} 동반
                    </span>
                  )}
                </Link>
                <span className="text-ink-muted text-xs whitespace-nowrap">
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
                      triggerClassName="text-xs font-medium text-ink-muted hover:text-primary hover:underline"
                    />
                  )}
                  <Link
                    href={`/calendar/${e.id}/edit?from=%2F`}
                    className="text-xs font-medium text-ink-muted hover:text-primary hover:underline"
                  >
                    수정
                  </Link>
                  <CancelEventButton
                    eventId={e.id}
                    returnTo="/"
                    className="text-xs font-medium text-ink-muted hover:text-danger hover:underline"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null,

    miniCalendar: (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">일정 (지난주 · 이번주 · 다음주)</h2>
          <Link href="/calendar" className="text-xs font-medium text-primary hover:underline">
            캘린더 전체보기 →
          </Link>
        </div>
        {/* 모바일·데스크탑 공통: 칸마다 실제 일정 텍스트 표시 */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-medium text-ink-muted">
              {d}
            </div>
          ))}
          {miniDays.map((d) => {
            const key = dateKey(d);
            return (
              <CalendarDayCell
                key={key}
                dayNum={d.getDate()}
                label={`${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`}
                isToday={key === dateKey(now)}
                inMonth
                returnTo="/"
                items={miniItemsByDay.get(key) ?? []}
                dense
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
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
          <span>· 날짜를 탭하면 펼쳐집니다</span>
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
              className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm hover:bg-border/40"
            >
              <span className="font-medium text-ink">{c.customer.name}</span>
              <span className="text-ink-muted text-xs">{formatPhone(c.customer.phone)}</span>
            </Link>
          ))}
          {uniqueCallTargets.length === 0 && <EmptyRow text="오늘 재접촉 예정인 고객이 없습니다" />}
        </DashboardSection>

        <DashboardSection title="발송대기 문자" href="/messages" linkLabel="문자함 전체 보기">
          {pendingMessages.map((m) => (
            <div key={m.id} className="rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-xs text-ink-muted mb-0.5">
                <span className="font-medium text-ink-2">{m.customer.name}</span>
                <span className="rounded bg-info-soft px-1.5 py-0.5 text-info">{m.triggerType}</span>
              </div>
              <p className="text-ink-2 truncate">{m.content}</p>
            </div>
          ))}
          {pendingMessages.length === 0 && <EmptyRow text="발송 대기중인 문자가 없습니다" />}
        </DashboardSection>

        <DashboardSection title="오늘 생일 고객" href="/customers" linkLabel="고객관리 보기">
          {todayBirthdays.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm hover:opacity-90"
            >
              <span className="font-medium text-ink">🎂 {c.name}</span>
              <span className="text-ink-muted text-xs">{formatPhone(c.phone)}</span>
            </Link>
          ))}
          {todayBirthdays.length === 0 && <EmptyRow text="오늘 생일인 고객이 없습니다" />}
        </DashboardSection>
      </div>
    ),

    bottomStats: (
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">통계</h2>
        <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-ink-muted mb-1.5">등급별 고객</p>
            <p className="text-ink-2">
              A {gradeMap.A ?? 0}명 · B {gradeMap.B ?? 0}명 · C {gradeMap.C ?? 0}명
            </p>
          </div>
          <div>
            <p className="text-ink-muted mb-1.5">보험종류별 유지계약</p>
            <p className="text-ink-2">
              {contractsByCategory.map((c) => `${c.category} ${c._count}건`).join(" · ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-ink-muted mb-1.5">이번달 신규계약</p>
            <p className="text-ink-2">{newContractsThisMonth}건</p>
          </div>
        </div>
      </div>
    ),
  };

  const visibleOrder = layout.order.filter((key) => !layout.hidden.includes(key));

  return (
    <div>
      <p className="text-base font-bold text-accent mb-2">{getEnergeticGreeting(user.name, now, user.birthDate)}</p>
      <h1 className="text-2xl font-bold text-ink mb-1">
        {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
      </h1>
      <p className="text-sm text-ink-muted mb-6">오늘 확인할 항목을 한눈에 보세요.</p>

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
      className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink-2 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-colors"
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
      className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-sm transition-colors"
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">
        {value}
        {sub && <span className="ml-1 text-xs font-normal text-ink-muted">{sub}</span>}
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
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href={href} className="text-xs font-medium text-primary hover:underline">
          {linkLabel} →
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-ink-muted py-2">{text}</p>;
}
