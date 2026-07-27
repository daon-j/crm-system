"use client";

import { useState } from "react";
import ReferrerCombobox from "@/components/ReferrerCombobox";

type EventType = "VISIT" | "TRAINING" | "CUSTOM";
type CustomerOption = { id: string; name: string; phone: string | null; batchName?: string | null };
type RecentContact = { id: string; label: string };

export default function QuickEventFields({
  customers,
  recentContacts,
  currentMonthBatchName,
  currentMonthLabel,
}: {
  customers: CustomerOption[];
  recentContacts: RecentContact[];
  currentMonthBatchName: string | null;
  currentMonthLabel: string;
}) {
  const [type, setType] = useState<EventType>("CUSTOM");

  return (
    <>
      <div>
        <label className="block text-xs text-slate-500 mb-1">구분</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="VISIT">방문</option>
          <option value="TRAINING">교육</option>
          <option value="CUSTOM">기타</option>
        </select>
      </div>

      {type === "VISIT" && (
        <div className="w-56">
          <label className="block text-xs text-slate-500 mb-1">고객</label>
          <ReferrerCombobox
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatchName}
            currentMonthLabel={currentMonthLabel}
            showMonthQuickPicks={false}
            showChosungIndex={false}
            name="customerId"
            placeholder="이름/전화번호/초성 검색"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-500 mb-1">제목</label>
        <input name="title" required className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">일시</label>
        <input
          type="datetime-local"
          name="startAt"
          required
          step={1800}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      {type === "VISIT" && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">동반자</label>
            <input
              name="companion"
              placeholder="예) 홍길동 멘토"
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">지역</label>
            <input
              name="area"
              placeholder="예) 다산동"
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
        </>
      )}

      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-slate-500 mb-1">메모</label>
        <input name="memo" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
      </div>

      {type === "VISIT" && (
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-500 mb-1">이번 방문 전용 준비물</label>
          <input name="prepNote" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
        </div>
      )}
    </>
  );
}
