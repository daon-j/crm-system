"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-2 mb-1">이름</label>
        <input
          type="text"
          name="name"
          autoComplete="name"
          className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-2 mb-1">이메일</label>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-2 mb-1">비밀번호</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-ink-muted mt-1">8자 이상</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-2 mb-1">초대코드</label>
        <input
          type="text"
          name="inviteCode"
          required
          autoComplete="off"
          className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-ink-muted mt-1">관리자에게 받은 초대코드를 입력하세요</p>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
