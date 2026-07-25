"use client";

import { useTransition } from "react";
import { updateContractStatus } from "@/lib/actions/contracts";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "유지중",
  EXPIRED: "만기됨",
  CANCELED: "해지",
};

export default function ContractStatusSelect({
  contractId,
  status,
}: {
  contractId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          updateContractStatus(contractId, next);
        });
      }}
      className="rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-600 disabled:opacity-50"
    >
      {Object.entries(STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
