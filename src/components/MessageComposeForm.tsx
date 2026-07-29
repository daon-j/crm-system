"use client";

import { useState } from "react";
import Link from "next/link";
import ReferrerCombobox from "@/components/ReferrerCombobox";
import TemplatePickerDialog from "@/components/TemplatePickerDialog";
import { fillTemplate, extractTemplateVars, AUTO_SILENT_KEYS, CONTRACT_KEYS, VISIT_KEYS, MANUAL_FIELD_META } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/format";

type CustomerOption = { id: string; name: string; phone: string | null; batchName?: string | null };
type RecentContact = { id: string; label: string };
type TemplateOption = { id: string; name: string; category: string; body: string };
type ContractOption = { id: string; insurer: string; productName: string; expiryDate: string | Date | null };
type NextVisit = { startAt: string; area: string | null };

export default function MessageComposeForm({
  action,
  customers,
  recentContacts,
  currentMonthBatchName,
  currentMonthLabel,
  templates,
  contractsByCustomer,
  nextVisitByCustomer = {},
  initialTemplateId,
  agentVars,
}: {
  action: (formData: FormData) => void;
  customers: CustomerOption[];
  recentContacts: RecentContact[];
  currentMonthBatchName: string | null;
  currentMonthLabel: string;
  templates: TemplateOption[];
  contractsByCustomer: Record<string, ContractOption[]>;
  nextVisitByCustomer?: Record<string, NextVisit>;
  initialTemplateId?: string;
  agentVars: { 설계사명: string; 설계사전화번호: string; 설계사내선번호: string };
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [contractId, setContractId] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    visitDefaults(null, nextVisitByCustomer),
  );
  const [content, setContent] = useState(() =>
    computeContent(templates, initialTemplateId ?? "", null, [], "", agentVars, "", {}),
  );

  const contracts = selectedCustomer ? (contractsByCustomer[selectedCustomer.id] ?? []) : [];
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const templateVars = selectedTemplate ? extractTemplateVars(selectedTemplate.body) : [];
  const needsContractFields = templateVars.some((v) => CONTRACT_KEYS.includes(v));
  const visitFieldsNeeded = templateVars.filter((v) => VISIT_KEYS.includes(v));
  const manualFieldsNeeded = templateVars.filter(
    (v) => !AUTO_SILENT_KEYS.includes(v) && !CONTRACT_KEYS.includes(v) && !VISIT_KEYS.includes(v),
  );

  function regenerate(next: {
    templateId?: string;
    customer?: CustomerOption | null;
    contractId?: string;
    specialNote?: string;
    fieldValues?: Record<string, string>;
  }) {
    const nextTemplateId = next.templateId ?? templateId;
    const nextCustomer = next.customer !== undefined ? next.customer : selectedCustomer;
    const nextContractId = next.contractId ?? contractId;
    const nextNote = next.specialNote ?? specialNote;
    const nextFieldValues = next.fieldValues ?? fieldValues;
    const nextContracts = nextCustomer ? (contractsByCustomer[nextCustomer.id] ?? []) : [];
    setContent(
      computeContent(templates, nextTemplateId, nextCustomer, nextContracts, nextNote, agentVars, nextContractId, nextFieldValues),
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">새 문자 작성</h1>
        <Link href="/messages" className="text-sm text-ink-muted hover:underline">
          ← 문자함
        </Link>
      </div>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">문자 템플릿</label>
          <TemplatePickerDialog
            templates={templates}
            agent={agentVars}
            customerName={selectedCustomer?.name}
            selectedId={templateId}
            onSelect={(id) => {
              setTemplateId(id);
              setContractId("");
              const nextFieldValues = visitDefaults(selectedCustomer, nextVisitByCustomer);
              setFieldValues(nextFieldValues);
              regenerate({ templateId: id, contractId: "", fieldValues: nextFieldValues });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            받는 고객 <span className="text-danger">*</span>
          </label>
          <ReferrerCombobox
            customers={customers}
            recentContacts={recentContacts}
            currentMonthBatchName={currentMonthBatchName}
            currentMonthLabel={currentMonthLabel}
            showMonthQuickPicks={false}
            showChosungIndex={false}
            name="customerId"
            placeholder="이름, 전화번호, 초성으로 검색"
            onSelect={(c) => {
              setSelectedCustomer(c);
              setContractId("");
              const nextFieldValues = { ...fieldValues, ...visitDefaults(c, nextVisitByCustomer) };
              setFieldValues(nextFieldValues);
              regenerate({ customer: c, contractId: "", fieldValues: nextFieldValues });
            }}
          />
        </div>

        {selectedTemplate && (
          <>
            {needsContractFields && (
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1">
                  관련 계약상품 <span className="text-ink-muted font-normal">(선택 시 상품명·만기일 자동으로 채워짐)</span>
                </label>
                <select
                  value={contractId}
                  onChange={(e) => {
                    setContractId(e.target.value);
                    regenerate({ contractId: e.target.value });
                  }}
                  disabled={!selectedCustomer}
                  className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-muted disabled:text-ink-muted"
                >
                  <option value="">선택 안함</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.insurer} {c.productName}
                    </option>
                  ))}
                </select>
                {!selectedCustomer && (
                  <p className="text-xs text-ink-muted mt-1">고객을 먼저 선택하면 계약상품을 고를 수 있어요.</p>
                )}
              </div>
            )}

            {!needsContractFields && (
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1">
                  관련 계약상품 <span className="text-ink-muted font-normal">(선택)</span>
                </label>
                <select
                  value={contractId}
                  onChange={(e) => {
                    setContractId(e.target.value);
                    regenerate({ contractId: e.target.value });
                  }}
                  disabled={!selectedCustomer}
                  className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-muted disabled:text-ink-muted"
                >
                  <option value="">선택 안함</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.insurer} {c.productName}
                    </option>
                  ))}
                </select>
                {!selectedCustomer && (
                  <p className="text-xs text-ink-muted mt-1">고객을 먼저 선택하면 계약상품을 고를 수 있어요.</p>
                )}
              </div>
            )}

            {(visitFieldsNeeded.length > 0 || manualFieldsNeeded.length > 0) && (
              <div className="rounded-lg border border-border p-3 space-y-3">
                <p className="text-xs font-semibold text-ink-muted">이 템플릿에 필요한 정보</p>

                {visitFieldsNeeded.map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-ink-2 mb-1">
                      {key} <span className="text-ink-muted font-normal">· 캘린더에서 자동 제안 (수정 가능)</span>
                    </label>
                    <input
                      value={fieldValues[key] ?? ""}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`예) ${key === "방문날짜" ? "7월 31일 (금)" : key === "방문시간" ? "오후 2:00" : "다산동 스타벅스"}`}
                      className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}

                {manualFieldsNeeded.map((key) => {
                  const meta = MANUAL_FIELD_META[key] ?? { label: key, placeholder: "" };
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-ink-2 mb-1">{meta.label}</label>
                      <input
                        value={fieldValues[key] ?? ""}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={meta.placeholder}
                        className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => regenerate({})}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  문구에 반영하기
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1">
                특이사항 <span className="text-ink-muted font-normal">(선택)</span>
              </label>
              <input
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="예) 다음 주 화요일 오전에 다시 연락 예정"
                className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => regenerate({})}
                className="mt-1.5 text-xs font-medium text-primary hover:underline"
              >
                문구에 반영하기
              </button>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            문구 <span className="text-danger">*</span>
          </label>
          <textarea
            name="content"
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문자 내용을 입력하세요"
            className="w-full rounded-lg border border-border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-ink-muted mt-1">
            발송대기 목록에 추가됩니다. 문자함에서 최종 확인 후 발송하면 발송완료로 이동합니다.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          대기함에 추가
        </button>
      </form>
    </div>
  );
}

function visitDefaults(customer: CustomerOption | null, nextVisitByCustomer: Record<string, NextVisit>): Record<string, string> {
  if (!customer) return {};
  const v = nextVisitByCustomer[customer.id];
  if (!v) return {};
  const d = new Date(v.startAt);
  const result: Record<string, string> = {
    방문날짜: d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }),
    방문시간: d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
  };
  if (v.area) result.방문장소 = v.area;
  return result;
}

function computeContent(
  templates: TemplateOption[],
  templateId: string,
  customer: CustomerOption | null,
  contracts: ContractOption[],
  specialNote: string,
  agentVars: Record<string, string>,
  contractId = "",
  fieldValues: Record<string, string> = {},
): string {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return "";
  const contract = contracts.find((c) => c.id === contractId);
  const vars: Record<string, string> = {
    고객명: customer?.name ?? "고객",
    ...agentVars,
    ...fieldValues,
  };
  if (contract) {
    vars.상품명 = contract.productName;
    if (contract.expiryDate) vars.만기일 = formatDate(contract.expiryDate);
  }
  let body = fillTemplate(template.body, vars);
  const extras: string[] = [];
  if (contract && !template.body.includes("{{상품명}}")) extras.push(`(관련 상품: ${contract.insurer} ${contract.productName})`);
  if (specialNote.trim()) extras.push(specialNote.trim());
  if (extras.length > 0) body += "\n" + extras.join("\n");
  return body;
}
