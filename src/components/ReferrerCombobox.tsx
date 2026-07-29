"use client";

import { useEffect, useRef, useState } from "react";
import { getChosung, CHOSUNG_INDEX } from "@/lib/hangul";
import { formatPhone } from "@/lib/format";

type ReferrerOption = { id: string; name: string; phone: string | null; batchName?: string | null };
type RecentContact = { id: string; label: string };

function displayLabel(c: ReferrerOption): string {
  const label = c.phone ? `${c.name} (${formatPhone(c.phone)})` : c.name;
  return c.batchName ? `${label} · ${c.batchName}` : label;
}

export default function ReferrerCombobox({
  customers,
  recentContacts = [],
  currentMonthBatchName = null,
  currentMonthLabel,
  showMonthQuickPicks = true,
  showChosungIndex = true,
  initialId,
  name = "referredById",
  placeholder = "이름, 전화번호, 초성(ㄱㅊㅅ)으로 검색 (없으면 비워두세요)",
  onSelect,
}: {
  customers: ReferrerOption[];
  recentContacts?: RecentContact[];
  currentMonthBatchName?: string | null;
  currentMonthLabel?: string;
  showMonthQuickPicks?: boolean;
  showChosungIndex?: boolean;
  initialId?: string | null;
  name?: string;
  placeholder?: string;
  onSelect?: (customer: ReferrerOption | null) => void;
}) {
  const initial = customers.find((c) => c.id === initialId) ?? null;
  const [query, setQuery] = useState(initial ? displayLabel(initial) : "");
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [open, setOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const [indexFilter, setIndexFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setBrowseAll(false);
        setIndexFilter(null);
        setMonthFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMonthCustomers = currentMonthBatchName
    ? customers.filter((c) => c.batchName === currentMonthBatchName)
    : [];
  const currentMonthQuickPicks = currentMonthCustomers
    .filter((c) => !recentContacts.some((rc) => rc.id === c.id))
    .slice(0, 5);

  const trimmed = query.trim();
  const trimmedDigits = trimmed.replace(/[^0-9]/g, "");
  const searchResults = trimmed
    ? customers
        .filter(
          (c) =>
            c.name.includes(trimmed) ||
            (c.phone && trimmedDigits && c.phone.replace(/[^0-9]/g, "").includes(trimmedDigits)) ||
            getChosung(c.name).includes(trimmed),
        )
        .slice(0, 8)
    : [];
  const indexResults = indexFilter ? customers.filter((c) => getChosung(c.name)[0] === indexFilter) : [];
  const results = trimmed
    ? searchResults
    : indexFilter
      ? indexResults
      : monthFilter
        ? currentMonthCustomers
        : browseAll
          ? customers
          : [];
  const showDropdown = open && (browseAll || indexFilter !== null || monthFilter || trimmed.length > 0);

  function resetFilters() {
    setOpen(false);
    setBrowseAll(false);
    setIndexFilter(null);
    setMonthFilter(false);
  }

  function select(c: ReferrerOption) {
    setSelectedId(c.id);
    setQuery(displayLabel(c));
    resetFilters();
    onSelect?.(c);
  }

  function clear() {
    setSelectedId(null);
    setQuery("");
    resetFilters();
    onSelect?.(null);
  }

  function badgeClass(c: ReferrerOption): string {
    return c.batchName === currentMonthBatchName
      ? "bg-accent-soft text-accent"
      : "bg-info-soft text-info";
  }

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
            setBrowseAll(false);
            setIndexFilter(null);
            setMonthFilter(false);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-border px-3.5 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBrowseAll(true);
              setOpen(true);
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            전체목록
          </button>
          {selectedId && (
            <button type="button" onClick={clear} className="text-xs text-ink-muted hover:text-danger">
              지우기
            </button>
          )}
        </div>
      </div>

      {!selectedId && recentContacts.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="self-center text-[11px] text-ink-muted">최근 접촉</span>
          {recentContacts.map((rc) => {
            const c = customers.find((cust) => cust.id === rc.id);
            if (!c) return null;
            return (
              <button
                key={rc.id}
                type="button"
                onClick={() => select(c)}
                className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[11px] text-ink-2 hover:bg-primary/10 hover:text-primary"
              >
                {rc.label}
              </button>
            );
          })}
        </div>
      )}

      {!selectedId && currentMonthBatchName && currentMonthCustomers.length > 0 && (
        <div className="mt-1.5">
          {showMonthQuickPicks ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">{currentMonthLabel} (아직 미접촉 우선)</span>
                <button
                  type="button"
                  onClick={() => {
                    setMonthFilter(true);
                    setOpen(true);
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  전체 {currentMonthLabel} 보기 →
                </button>
              </div>
              {currentMonthQuickPicks.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {currentMonthQuickPicks.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => select(c)}
                      className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] text-accent hover:opacity-90"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMonthFilter(true);
                setOpen(true);
              }}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              전체 {currentMonthLabel} 보기 →
            </button>
          )}
        </div>
      )}

      {!selectedId && showChosungIndex && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[11px] text-ink-muted">초성</span>
          {CHOSUNG_INDEX.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setIndexFilter(ch);
                setQuery("");
                setMonthFilter(false);
                setOpen(true);
              }}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                indexFilter === ch
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-ink-muted hover:bg-surface-muted"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-surface text-sm shadow-lg">
          {(browseAll || indexFilter || monthFilter) && (
            <li className="sticky top-0 border-b border-border bg-surface-muted px-3.5 py-1.5 text-[11px] text-ink-muted">
              {monthFilter
                ? `${currentMonthLabel} · ${results.length}명`
                : indexFilter
                  ? `${indexFilter} · ${results.length}명`
                  : `전체 고객 ${customers.length}명`}
            </li>
          )}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => select(c)}
                className="w-full px-3.5 py-2 text-left hover:bg-primary/10"
              >
                {c.name}
                {c.phone && <span className="ml-1 text-ink-muted">({formatPhone(c.phone)})</span>}
                {c.batchName && (
                  <span className={`ml-1.5 rounded px-1 py-0.5 text-[10px] ${badgeClass(c)}`}>
                    {c.batchName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showDropdown && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-ink-muted shadow-lg">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
