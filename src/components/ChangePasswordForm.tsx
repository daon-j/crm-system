"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/auth";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, undefined);

  return (
    <form
      action={formAction}
      key={state?.success ? "done" : "form"}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div>
        <label className="block text-xs text-slate-500 mb-1">현재 비밀번호</label>
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">새 비밀번호</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">8자 이상</p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">비밀번호가 변경되었습니다</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
