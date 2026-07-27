"use client";

import { useState } from "react";
import ReferrerCombobox from "@/components/ReferrerCombobox";
import { fillTemplate } from "@/lib/messageTemplate";

type CustomerOption = { id: string; name: string; phone: string | null; batchName?: string | null };
type RecentContact = { id: string; label: string };
type TemplateOption = { id: string; name: string; category: string; body: string };
type ContractOption = { id: string; insurer: string; productName: string };

export default function MessageComposeForm({
  action,
  customers,
  recentContacts,
  currentMonthBatchName,
  currentMonthLabel,
  templates,
  contractsByCustomer,
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
  initialTemplateId?: string;
  agentVars: Record<string, string>;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [contractId, setContractId] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [content, setContent] = useState(() =>
    computeContent(templates, initialTemplateId ?? "", null, [], "", agentVars),
  );

  const contracts = selectedCustomer ? (contractsByCustomer[selectedCustomer.id] ?? []) : [];
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  function regenerate(next: {
    templateId?: string;
    customer?: CustomerOption | null;
    contractId?: string;
    specialNote?: string;
  }) {
    const nextTemplateId = next.templateId ?? templateId;
    const nextCustomer = next.customer !== undefined ? next.customer : selectedCustomer;
    const nextContractId = next.contractId ?? contractId;
    const nextNote = next.specialNote ?? specialNote;
    const nextContracts = nextCustomer ? (contractsByCustomer[nextCustomer.id] ?? []) : [];
    setContent(
      computeContent(templates, nextTemplateId, nextCustomer, nextContracts, nextNote, agentVars, nextContractId),
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">새 문자 작성</h1>
      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">문자 템플릿</label>
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setContractId("");
              regenerate({ templateId: e.target.value, contractId: "" });
            }}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">직접 작성 (템플릿 없음)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            받는 고객 <span className="text-red-500">*</span>
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
              regenerate({ customer: c, contractId: "" });
            }}
          />
        </div>

        {selectedTemplate && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                관련 계약상품 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <select
                value={contractId}
                onChange={(e) => {
                  setContractId(e.target.value);
                  regenerate({ contractId: e.target.value });
                }}
                disabled={!selectedCustomer}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">선택 안함</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.insurer} {c.productName}
                  </option>
                ))}
              </select>
              {!selectedCustomer && (
                <p className="text-xs text-slate-400 mt-1">고객을 먼저 선택하면 계약상품을 고를 수 있어요.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                특이사항 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="예) 다음 주 화요일 오전에 다시 연락 예정"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => regenerate({})}
                className="mt-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                문구에 반영하기
              </button>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            문구 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문자 내용을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            발송대기 목록에 추가됩니다. 문자함에서 최종 확인 후 발송하면 발송완료로 이동합니다.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          대기함에 추가
        </button>
      </form>
    </div>
  );
}

function computeContent(
  templates: TemplateOption[],
  templateId: string,
  customer: CustomerOption | null,
  contracts: ContractOption[],
  specialNote: string,
  agentVars: Record<string, string>,
  contractId = "",
): string {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return "";
  let body = fillTemplate(template.body, {
    고객명: customer?.name ?? "고객",
    ...agentVars,
  });
  const extras: string[] = [];
  const contract = contracts.find((c) => c.id === contractId);
  if (contract) extras.push(`(관련 상품: ${contract.insurer} ${contract.productName})`);
  if (specialNote.trim()) extras.push(specialNote.trim());
  if (extras.length > 0) body += "\n" + extras.join("\n");
  return body;
}
