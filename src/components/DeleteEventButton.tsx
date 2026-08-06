"use client";

import { deleteEvent } from "@/lib/actions/calendar";

export default function DeleteEventButton({
  eventId,
  returnTo,
}: {
  eventId: string;
  returnTo?: string;
}) {
  return (
    <form action={deleteEvent.bind(null, eventId)}>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <button
        type="submit"
        onClick={(e) => {
          if (
            !confirm(
              "이 일정을 완전히 삭제하시겠습니까?\n취소와 달리 기록이 전혀 남지 않으며, 되돌릴 수 없습니다.",
            )
          ) {
            e.preventDefault();
          }
        }}
        className="rounded-lg border border-danger/30 bg-surface px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
      >
        완전 삭제하기
      </button>
    </form>
  );
}
