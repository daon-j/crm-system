"use client";

import { cancelEvent } from "@/lib/actions/calendar";

export default function CancelEventButton({
  eventId,
  className = "shrink-0 rounded-lg border border-border px-2 py-1.5 text-xs text-ink-muted hover:text-danger hover:border-danger/30",
  label = "취소",
  returnTo,
}: {
  eventId: string;
  className?: string;
  label?: string;
  returnTo?: string;
}) {
  return (
    <form action={cancelEvent.bind(null, eventId)}>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <button
        type="submit"
        title="일정 취소"
        onClick={(e) => {
          if (!confirm("이 일정을 취소하시겠습니까?\n기록은 지워지지 않고 취소됨으로 남습니다.")) {
            e.preventDefault();
          }
        }}
        className={className}
      >
        {label}
      </button>
    </form>
  );
}
