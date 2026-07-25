"use client";

import { useState } from "react";
import ReferrerCombobox from "@/components/ReferrerCombobox";

type EventType = "VISIT" | "TRAINING" | "CUSTOM";

const TITLE_LABEL: Record<EventType, string> = {
  VISIT: "방문 일정 잡기",
  TRAINING: "교육 일정 추가",
  CUSTOM: "새 일정 추가",
};

const TITLE_PLACEHOLDER: Record<EventType, string> = {
  VISIT: "예) 1차 방문 상담",
  TRAINING: "예) 보험상품 심화 세미나",
  CUSTOM: "예) 세무서 서류 제출",
};

type CustomerOption = { id: string; name: string; phone: string | null; batchName?: string | null };
type RecentContact = { id: string; label: string };

export default function NewEventForm({
  action,
  customers,
  recentContacts,
  currentMonthBatchName,
  currentMonthLabel,
}: {
  action: (formData: FormData) => void;
  customers: CustomerOption[];
  recentContacts: RecentContact[];
  currentMonthBatchName: string | null;
  currentMonthLabel: string;
}) {
  const [type, setType] = useState<EventType>("VISIT");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{TITLE_LABEL[type]}</h1>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">구분</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VISIT">방문</option>
            <option value="TRAINING">교육</option>
            <option value="CUSTOM">기타</option>
          </select>
        </div>

        {type === "VISIT" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">고객</label>
            <ReferrerCombobox
              customers={customers}
              recentContacts={recentContacts}
              currentMonthBatchName={currentMonthBatchName}
              currentMonthLabel={currentMonthLabel}
              showMonthQuickPicks={false}
              showChosungIndex={false}
              name="customerId"
              placeholder="이름 또는 전화번호로 검색"
            />
            <p className="text-xs text-slate-400 mt-1">
              방문 일정이면 고객을 연결하세요. 방문차수·고객 상세페이지 방문이력에 자동 반영됩니다.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder={TITLE_PLACEHOLDER[type]}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            일시 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="startAt"
            required
            step={1800}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {type === "VISIT" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">동반자</label>
              <input
                type="text"
                name="companion"
                placeholder="예) 홍길동 멘토"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">지역</label>
              <input
                type="text"
                name="area"
                placeholder="예) 다산동"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">메모</label>
          <textarea
            name="memo"
            rows={3}
            placeholder={type === "VISIT" ? "예) 만기 임박 실손보험 갱신 상담" : "예) 준비물, 참고사항"}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          일정 등록
        </button>
      </form>
    </div>
  );
}
