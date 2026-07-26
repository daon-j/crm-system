"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importCustomers, type ImportState } from "@/lib/actions/import";

const initialImportState: ImportState = { ready: false, successCount: 0, errors: [] };

export default function ImportForm({ batches }: { batches: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(importCustomers, initialImportState);

  return (
    <>
      <form action={action} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">소속 고객DB(배치)</p>
          <p className="text-xs text-slate-400 mb-3">
            이 파일의 고객들이 속할 배치입니다. 기존 배치를 고르거나 새 배치명을 입력하세요 (필수).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">기존 배치 선택</label>
              <select
                name="batchId"
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택 안함</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">또는 새 배치명 입력</label>
              <input
                type="text"
                name="newBatchName"
                placeholder="예) 2026년 7월DB"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            엑셀 파일 <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">
            필수 컬럼: 이름·생년월일·연락처·주소·직업·성별·주민등록번호 (양식 파일 참고). 보험상품 정보는 있는 경우에만 입력하세요 — 기존 가입상품으로 등록됩니다.
            모바일동의는 비워두면 &quot;N&quot;으로 등록되며, &quot;Y&quot;로 입력할 경우 모바일동의일자도 함께 입력해야 합니다.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "업로드 중..." : "업로드 및 등록"}
        </button>
      </form>

      {state.ready && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            결과: {state.successCount}건 등록 완료
            {state.errors.length > 0 && ` · ${state.errors.length}건 실패`}
          </p>
          {state.errors.length > 0 && (
            <div className="space-y-1">
              {state.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">
                  {e.row > 0 ? `${e.row}행: ` : ""}
                  {e.reason}
                </p>
              ))}
            </div>
          )}
          {state.successCount > 0 && (
            <Link href="/customers" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
              고객관리에서 확인하기 →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
