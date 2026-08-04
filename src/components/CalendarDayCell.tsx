"use client";

import { useRef } from "react";
import Link from "next/link";
import { setRoutineAttendance } from "@/lib/actions/calendar";
import { TYPE_STYLE, TYPE_DOT, TYPE_TEXT, type DayItem } from "@/lib/calendarTypes";
import CancelEventButton from "@/components/CancelEventButton";

const MAX_DENSE_LINES = 5;

export default function CalendarDayCell({
  dayNum,
  label,
  isToday,
  inMonth,
  items,
  dense = false,
  returnTo,
}: {
  dayNum: number;
  label: string;
  isToday: boolean;
  inMonth: boolean;
  items: DayItem[];
  dense?: boolean;
  returnTo?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const routineItems = items.filter((i) => i.type === "ROUTINE");
  const otherItems = items.filter((i) => i.type !== "ROUTINE");
  const dotTypes = Array.from(new Set(otherItems.map((i) => i.type)));

  const denseLines = dense
    ? [
        ...otherItems.map((i) => ({
          key: i.key,
          text: i.label,
          color: i.type === "VISIT" && i.attended ? "text-success" : TYPE_TEXT[i.type],
        })),
        ...routineItems.map((r) => ({
          key: r.key,
          text: r.routineType === "MEETING" ? "정보미팅" : "오전교육",
          color: r.attended ? "text-success" : "text-ink-muted",
        })),
      ]
    : [];
  const visibleDenseLines = denseLines.slice(0, MAX_DENSE_LINES);
  const extraDenseCount = denseLines.length - visibleDenseLines.length;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`flex flex-col items-center gap-1 rounded-lg pt-1.5 transition-colors sm:pt-2 ${
          dense ? "min-h-[2.6rem] lg:min-h-[4.5rem]" : "aspect-[1/1.05]"
        } ${isToday ? "bg-info-soft" : "hover:bg-surface-muted"} ${inMonth ? "" : "opacity-35"}`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold sm:h-6 sm:w-6 sm:text-xs lg:h-7 lg:w-7 lg:text-sm ${
            isToday ? "bg-primary text-primary-ink" : "text-ink"
          }`}
        >
          {dayNum}
        </span>
        {dense ? (
          <span className="flex w-full flex-col gap-[1px] px-[2px] lg:gap-0.5 lg:px-1">
            {visibleDenseLines.map((l) => (
              <span
                key={l.key}
                className={`truncate text-center text-[8px] font-bold leading-tight lg:text-[11px] ${l.color}`}
              >
                {l.text}
              </span>
            ))}
            {extraDenseCount > 0 && (
              <span className="text-center text-[8px] font-bold leading-tight text-ink-muted lg:text-[11px]">
                +{extraDenseCount}
              </span>
            )}
          </span>
        ) : (
          <span className="flex max-w-[26px] flex-wrap items-center justify-center gap-[3px] sm:max-w-[34px]">
            {routineItems.map((r) => (
              <span
                key={r.key}
                className={`h-[5px] w-[5px] rounded-full sm:h-[6px] sm:w-[6px] ${r.attended ? "bg-success" : "bg-border"}`}
              />
            ))}
            {dotTypes.map((t) => {
              const allDone = t === "VISIT" && otherItems.filter((i) => i.type === "VISIT").every((i) => i.attended);
              return (
                <span
                  key={t}
                  className={`h-[5px] w-[5px] rounded-full sm:h-[6px] sm:w-[6px] ${allDone ? "bg-success" : TYPE_DOT[t]}`}
                />
              );
            })}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-xl border border-border bg-surface p-0 max-h-[85vh] backdrop:bg-black/30"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="max-h-[85vh] overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-ink">{label}</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="닫기"
              className="text-ink-muted hover:text-ink"
            >
              ✕
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-ink-muted">일정이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2">
              {routineItems.map((r) => (
                <div key={r.key} className="flex items-center gap-1.5">
                  <form
                    action={setRoutineAttendance.bind(null, r.routineDate!, r.routineType!, !r.attended)}
                    className="min-w-0 flex-1"
                  >
                    <button
                      type="submit"
                      className={`block w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium ${
                        r.attended ? "bg-success-soft text-success line-through" : TYPE_STYLE[r.type]
                      }`}
                    >
                      {r.attended ? "✓ " : ""}
                      {r.label}
                    </button>
                  </form>
                  {r.eventId && (
                    <>
                      <Link
                        href={returnTo ? `/calendar/${r.eventId}/edit?from=${encodeURIComponent(returnTo)}` : `/calendar/${r.eventId}/edit`}
                        className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-xs text-primary"
                        title="수정"
                      >
                        ✏️
                      </Link>
                      <CancelEventButton eventId={r.eventId} returnTo={returnTo} />
                    </>
                  )}
                </div>
              ))}
              {otherItems.map((item) => {
                const visitDone = item.type === "VISIT" && item.attended;
                const content = (
                  <span
                    className={`block rounded-lg px-2.5 py-2 text-sm ${
                      visitDone ? "bg-success-soft text-success" : TYPE_STYLE[item.type]
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
                          href={returnTo ? `/calendar/${item.eventId}/edit?from=${encodeURIComponent(returnTo)}` : `/calendar/${item.eventId}/edit`}
                          className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-xs text-primary"
                          title="수정"
                        >
                          ✏️
                        </Link>
                        <CancelEventButton eventId={item.eventId} returnTo={returnTo} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
