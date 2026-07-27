"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExpandableNameList({
  items,
  visibleCount = 5,
}: {
  items: { id: string; name: string }[];
  visibleCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, visibleCount);
  const hiddenCount = items.length - shown.length;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((item, i) => (
        <span key={item.id}>
          {i > 0 && ", "}
          <Link href={`/customers/${item.id}`} className="text-blue-700 hover:underline">
            {item.name}
          </Link>
        </span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
        >
          {hiddenCount}+
        </button>
      )}
    </span>
  );
}
