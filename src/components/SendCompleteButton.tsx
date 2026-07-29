"use client";

import { useTransition } from "react";
import { sendMessage } from "@/lib/actions/messages";
import { showToast } from "@/lib/toast";

export default function SendCompleteButton({
  messageId,
  customerName,
}: {
  messageId: string;
  customerName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await sendMessage(messageId);
      showToast(`✅ ${customerName}님에게 발송완료 처리했습니다`);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
    >
      {isPending ? "처리 중..." : "발송완료 처리"}
    </button>
  );
}
