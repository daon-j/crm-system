"use client";

import { useRef } from "react";
import CopyButton from "@/components/CopyButton";

export default function VisitPrepModal({
  customerName,
  seq,
  phone,
  address,
  products,
  mobileConsentText,
  visitNote,
  triggerLabel = "방문 준비하기 →",
  triggerClassName = "rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap",
}: {
  customerName: string;
  seq?: number;
  phone: string;
  address: string;
  products: string[];
  mobileConsentText: string;
  visitNote?: string | null;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const prepItems = (visitNote ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const summaryText = [
    `${customerName} 고객${seq ? ` (방문${seq}차)` : ""}`,
    `전화번호: ${phone}`,
    `주소: ${address}`,
    `가입상품: ${products.length > 0 ? products.join(", ") : "없음"}`,
    `모바일동의: ${mobileConsentText}`,
    ...(prepItems.length > 0 ? [`준비물: ${prepItems.join(", ")}`] : []),
  ].join("\n");

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={triggerClassName}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-xl border border-slate-200 p-0 max-h-[85vh] backdrop:bg-black/30"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="max-h-[85vh] overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              {customerName} 고객{seq ? ` · 방문${seq}차` : ""}
            </h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="닫기"
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {prepItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-1.5">준비물</p>
              <ul className="space-y-1.5">
                {prepItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">📞 {phone}</span>
              <CopyButton text={phone} label="복사" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 min-w-0 truncate">📍 {address}</span>
              <CopyButton text={address} label="복사" />
            </div>
            <p className="text-slate-600">💼 {products.length > 0 ? products.join(", ") : "가입상품 없음"}</p>
            <p className="text-slate-600">📱 모바일동의: {mobileConsentText}</p>
          </div>

          <div className="mt-3">
            <CopyButton text={summaryText} label="전체 정보 복사" />
          </div>
        </div>
      </dialog>
    </>
  );
}
