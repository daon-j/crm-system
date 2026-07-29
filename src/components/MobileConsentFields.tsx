"use client";

import { useState } from "react";
import { toDateInputValue } from "@/lib/format";

export default function MobileConsentFields({
  initialConsent,
  initialDate,
}: {
  initialConsent?: boolean;
  initialDate?: Date | string | null;
}) {
  const [consent, setConsent] = useState<"" | "Y" | "N">(
    initialConsent === undefined ? "" : initialConsent ? "Y" : "N",
  );

  return (
    <div className="rounded-lg border-2 border-accent/40 bg-accent-soft p-4">
      <p className="text-sm font-semibold text-accent mb-1">
        모바일동의 <span className="text-danger">*</span>
      </p>
      <p className="text-xs text-accent mb-3">
        동의해야 내부 시스템에서 고객정보 조회 및 가입설계가 가능합니다. 방문 시(또는 방문 전) 꼭 확인하세요.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">동의 여부</label>
          <select
            name="mobileConsent"
            required
            value={consent}
            onChange={(e) => setConsent(e.target.value as "" | "Y" | "N")}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>
              선택
            </option>
            <option value="Y">Y (동의함)</option>
            <option value="N">N (동의안함)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            동의일자 {consent === "Y" && <span className="text-danger">*</span>}
          </label>
          <input
            type="date"
            name="mobileConsentDate"
            required={consent === "Y"}
            disabled={consent !== "Y"}
            defaultValue={toDateInputValue(initialDate)}
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-muted disabled:text-ink-muted"
          />
        </div>
      </div>
    </div>
  );
}
