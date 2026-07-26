import { toDateInputValue } from "@/lib/format";
import MobileConsentFields from "@/components/MobileConsentFields";
import ReferrerCombobox from "@/components/ReferrerCombobox";

type CustomerFormValues = {
  name?: string;
  gender?: string | null;
  residentNumber?: string | null;
  birthDate?: Date | null;
  phone?: string | null;
  address?: string | null;
  job?: string | null;
  email?: string | null;
  grade?: string;
  marketingOptIn?: boolean;
  mobileConsent?: boolean;
  mobileConsentDate?: Date | null;
  memo?: string | null;
  batchId?: string | null;
  referredById?: string | null;
};

export default function CustomerForm({
  action,
  initial,
  submitLabel,
  showContractFields,
  batches,
  referrableCustomers,
  recentContacts = [],
  currentMonthBatchName,
  currentMonthLabel,
}: {
  action: (formData: FormData) => void;
  initial?: CustomerFormValues;
  submitLabel: string;
  showContractFields?: boolean;
  batches: { id: string; name: string }[];
  referrableCustomers: { id: string; name: string; phone: string | null; batchName?: string | null }[];
  recentContacts?: { id: string; label: string }[];
  currentMonthBatchName?: string | null;
  currentMonthLabel?: string;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            생년월일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="birthDate"
            required
            defaultValue={toDateInputValue(initial?.birthDate)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phone"
            required
            placeholder="010-0000-0000"
            defaultValue={initial?.phone ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            성별 <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            required
            defaultValue={initial?.gender ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              선택
            </option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            주민등록번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="residentNumber"
            required
            placeholder="예) 901231-1234567"
            defaultValue={initial?.residentNumber ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">민감정보입니다. 화면 노출 시에는 뒷자리가 가려져서 표시됩니다.</p>
        </div>
      </div>

      <MobileConsentFields
        initialConsent={initial?.mobileConsent}
        initialDate={initial?.mobileConsentDate}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          주소 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="address"
          required
          defaultValue={initial?.address ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            직업 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="job"
            required
            defaultValue={initial?.job ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initial?.email ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          고객 등급
        </label>
        <select
          name="grade"
          defaultValue={initial?.grade ?? "B"}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="A">A등급 (우수고객 · 월 1회 관리)</option>
          <option value="B">B등급 (분기 1회 관리)</option>
          <option value="C">C등급 (반기 1회 관리)</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={initial?.marketingOptIn ?? false}
          className="rounded border-slate-300"
        />
        광고성 정보(이벤트, 상품 안내 등) 수신에 동의함
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          메모
        </label>
        <textarea
          name="memo"
          rows={3}
          placeholder="예) 야구 좋아함, 아들 고3, 자영업 운영"
          defaultValue={initial?.memo ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">소속 고객DB(배치)</p>
        <p className="text-xs text-slate-400 mb-3">
          매월 받는 고객 리스트 단위입니다. 기존 배치를 고르거나, 새 배치명을 직접 입력하면 자동으로 만들어집니다. 선택사항입니다.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">기존 배치 선택</label>
            <select
              name="batchId"
              defaultValue={initial?.batchId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">배치 없음</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              또는 새 배치명 입력
            </label>
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
        <label className="block text-sm font-medium text-slate-700 mb-1">소개자</label>
        <ReferrerCombobox
          customers={referrableCustomers}
          initialId={initial?.referredById}
          recentContacts={recentContacts}
          currentMonthBatchName={currentMonthBatchName}
          currentMonthLabel={currentMonthLabel}
          showMonthQuickPicks={false}
          showChosungIndex={false}
        />
        <p className="text-xs text-slate-400 mt-1">이 고객을 소개해준 기존 고객이 있다면 검색해서 선택하세요. 없으면 비워두세요.</p>
      </div>

      {showContractFields && (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700 mb-1">기존 가입 보험상품 (선택)</p>
          <p className="text-xs text-slate-400 mb-3">
            등록 전에 이미 가입돼 있던 상품이 있으면 입력하세요. 원수사(예: DB손해보험) 기존 계약처럼, 설계사가 아직 체결하지 않은 상품입니다.
            없으면 비워두고, 나중에 직접 체결한 계약은 고객 상세페이지에서 &quot;+ 계약 추가&quot;로 등록하세요.
          </p>
          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">보험사</label>
              <input
                type="text"
                name="contractInsurer"
                placeholder="예) DB손해보험"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">상품명</label>
              <input
                type="text"
                name="contractProductName"
                placeholder="예) 실손보험"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">가입일</label>
              <input
                type="date"
                name="contractJoinDate"
                defaultValue={toDateInputValue(new Date())}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">만기일</label>
              <input
                type="date"
                name="contractExpiryDate"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">월 보험료(원)</label>
              <input
                type="number"
                name="contractPremium"
                placeholder="예) 35000"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
