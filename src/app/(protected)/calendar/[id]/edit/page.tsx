import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateTimeInputValue, formatDateTime } from "@/lib/format";
import { updateEvent, cancelEvent } from "@/lib/actions/calendar";
import { requireUser } from "@/lib/auth";

export default async function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const event = await prisma.calendarEvent.findFirst({
    where: { id, userId: user.id },
    include: { customer: true, changeLogs: { orderBy: { createdAt: "desc" } } },
  });
  if (!event) notFound();

  const boundUpdate = updateEvent.bind(null, event.id);
  const boundCancel = cancelEvent.bind(null, event.id);

  const listBackHref = event.customerId ? `/customers/${event.customerId}` : "/calendar";
  const listBackLabel = event.customerId ? "← 고객 상세로" : "← 캘린더";

  return (
    <div className="max-w-xl">
      <Link href={listBackHref} className="text-sm text-ink-muted hover:underline">
        {listBackLabel}
      </Link>
      <h1 className="text-2xl font-bold text-ink mb-1 mt-1">
        {event.type === "VISIT" ? "방문 일정 수정" : event.type === "ROUTINE" ? "루틴 일정 수정" : "일정 수정"}
      </h1>
      {event.customer && (
        <p className="text-sm text-ink-muted mb-6">
          <Link href={`/customers/${event.customer.id}`} className="text-primary hover:underline">
            {event.customer.name} 고객
          </Link>{" "}
          방문 일정입니다. 시간·날짜 변경, 지연, 동반자/지역 변경 모두 여기서 저장하면 됩니다.
        </p>
      )}
      {event.type === "ROUTINE" && (
        <p className="text-sm text-ink-muted mb-6">
          정보미팅·오전교육은 매일 자동으로 생성되는 루틴 일정입니다. 이 날짜만 시간·제목을 바꾸거나 아래에서 취소할 수 있어요.
        </p>
      )}

      {event.changeLogs.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-xs font-semibold text-ink-2 mb-2">지금까지의 변경 이력</p>
          <div className="space-y-1">
            {event.changeLogs.map((l) => (
              <p key={l.id} className="text-xs text-ink-muted">
                {l.action === "RESCHEDULED" ? (
                  <>
                    🔄 {formatDateTime(l.previousStartAt)} → {formatDateTime(l.newStartAt)}
                  </>
                ) : (
                  <>❌ {formatDateTime(l.previousStartAt)} 예정 건 취소</>
                )}
                {l.reason && ` · 사유: ${l.reason}`}
                {` (${formatDateTime(l.createdAt)})`}
              </p>
            ))}
          </div>
        </div>
      )}

      <form action={boundUpdate} noValidate className="rounded-xl border border-border bg-surface p-5 space-y-4">
        {event.type === "ROUTINE" ? (
          <input type="hidden" name="type" value="ROUTINE" />
        ) : (
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">구분</label>
            <select
              name="type"
              defaultValue={event.type}
              className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="VISIT">방문</option>
              <option value="TRAINING">교육</option>
              <option value="CUSTOM">기타</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            제목 <span className="text-danger">*</span>
          </label>
          <input
            name="title"
            required
            defaultValue={event.title}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            날짜·시간 <span className="text-danger">*</span>
          </label>
          <input
            type="datetime-local"
            name="startAt"
            required
            step={1800}
            defaultValue={toDateTimeInputValue(event.startAt)}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-ink-muted mt-1">시간 변경, 날짜 변경, 지연 모두 이 값을 바꾸면 됩니다.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">변경 사유</label>
          <input
            name="reason"
            placeholder="예) 고객 요청으로 이틀 연기"
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-ink-muted mt-1">
            날짜·시간을 바꾸는 경우에만 기록되며, 나중에 언제·왜 바뀌었는지 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">동반자</label>
            <input
              name="companion"
              defaultValue={event.companion ?? ""}
              placeholder="예) 홍길동 멘토"
              className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">지역</label>
            <input
              name="area"
              defaultValue={event.area ?? ""}
              placeholder="예) 다산동"
              className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">메모</label>
          <textarea
            name="memo"
            rows={3}
            defaultValue={event.memo ?? ""}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {event.type === "VISIT" && (
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-1">이번 방문 전용 준비물</label>
            <textarea
              name="prepNote"
              rows={2}
              defaultValue={event.prepNote ?? ""}
              placeholder="예) 배우자 동반 예정 - 가족관계증명서 필요"
              className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-ink-muted mt-1">
              차수별 공통 준비물과 별개로, 이 방문에서만 필요한 항목을 적어두면 방문 준비 대화상자에 추가로 표시됩니다.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            저장하기
          </button>
          <Link
            href={event.customerId ? `/customers/${event.customerId}` : "/calendar"}
            className="text-sm text-ink-muted hover:underline"
          >
            취소하고 돌아가기
          </Link>
        </div>
      </form>

      <div className="mt-6 rounded-xl border border-danger/30 bg-danger-soft p-4">
        <p className="text-sm font-medium text-danger mb-1">
          {event.type === "VISIT" ? "방문 취소" : "일정 취소"}
        </p>
        <p className="text-xs text-danger/80 mb-3">
          취소해도 기록은 지워지지 않고 고객 상세페이지의 방문이력에 &quot;취소됨&quot;으로 계속 남습니다.
        </p>
        <form action={boundCancel} className="space-y-2">
          <input
            name="reason"
            placeholder="취소 사유 (예: 고객 사정으로 방문 취소)"
            className="w-full rounded-lg border border-danger/30 bg-surface px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-danger"
          />
          <button
            type="submit"
            className="rounded-lg border border-danger/30 bg-surface px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            이 일정 취소하기
          </button>
        </form>
      </div>
    </div>
  );
}
