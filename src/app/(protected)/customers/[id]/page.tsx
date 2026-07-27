import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, formatPhone, daysUntil, maskResidentNumber, GRADE_LABEL } from "@/lib/format";
import { addFamilyMember, deleteFamilyMember, deleteCustomer } from "@/lib/actions/customers";
import { requireUser } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import ExpandableNameList from "@/components/ExpandableNameList";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, userId: user.id },
    include: {
      familyMembers: true,
      consultations: {
        orderBy: { createdAt: "desc" },
        include: { resultType: true },
      },
      contracts: { orderBy: { expiryDate: "asc" } },
      batch: true,
      referredBy: true,
      referrals: true,
      events: {
        where: { type: "VISIT" },
        orderBy: { startAt: "asc" },
        include: { changeLogs: { orderBy: { createdAt: "asc" } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const now = new Date();
  const scheduledEvents = customer.events.filter((e) => e.status === "SCHEDULED");
  const completedVisits = scheduledEvents.filter((e) => e.startAt <= now);
  const upcomingVisits = scheduledEvents.filter((e) => e.startAt > now);
  const canceledVisits = customer.events
    .filter((e) => e.status === "CANCELED")
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
  const hasContract = customer.contracts.some((c) => c.source === "AGENT_SALE");

  const boundAddFamily = addFamilyMember.bind(null, customer.id);
  const boundDeleteCustomer = deleteCustomer.bind(null, customer.id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {customer.grade}등급
            </span>
            {customer.batch && (
              <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {customer.batch.name}
              </span>
            )}
            {completedVisits.length > 0 && (
              <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                방문{completedVisits.length}차
              </span>
            )}
            {hasContract && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                체결
              </span>
            )}
            {customer.referredBy && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                소개
              </span>
            )}
            {customer.mobileConsent ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                📱 모바일동의 완료
              </span>
            ) : (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-300">
                📱 모바일 미동의
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{GRADE_LABEL[customer.grade]}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/calls?customerId=${customer.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            콜 상담 기록하기
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            수정
          </Link>
          <form action={boundDeleteCustomer}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </form>
        </div>
      </div>

      {!customer.mobileConsent && (
        <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-red-700">📱 모바일 미동의 고객입니다</p>
            <p className="text-xs text-red-600 mt-0.5">
              모바일동의가 있어야 내부 시스템에서 고객정보 조회 및 가입설계가 가능합니다. 방문 시 꼭 동의를 받아주세요.
            </p>
          </div>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="shrink-0 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 whitespace-nowrap"
          >
            동의 처리하기 →
          </Link>
        </div>
      )}

      {/* 기본정보 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">기본정보</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <InfoRow label="성별" value={customer.gender ?? "-"} />
          <InfoRow
            label="주민등록번호"
            value={maskResidentNumber(customer.residentNumber ? decrypt(customer.residentNumber) : null)}
          />
          <InfoRow label="생년월일" value={formatDate(customer.birthDate)} />
          <InfoRow label="연락처" value={formatPhone(customer.phone)} />
          <InfoRow label="주소" value={customer.address ?? "-"} />
          <InfoRow label="직업" value={customer.job ?? "-"} />
          <InfoRow label="이메일" value={customer.email ?? "-"} />
          <InfoRow label="소속 DB(배치)" value={customer.batch?.name ?? "-"} />
          <InfoRow
            label="모바일동의"
            value={
              customer.mobileConsent
                ? `동의함 (${formatDate(customer.mobileConsentDate)})`
                : "동의안함"
            }
          />
          <InfoRow
            label="광고문자 수신동의"
            value={customer.marketingOptIn ? "동의함" : "동의안함"}
          />
        </dl>
        {customer.referredBy && (
          <p className="mt-3 text-sm text-slate-600">
            <span className="text-slate-400">소개자 · </span>
            <Link href={`/customers/${customer.referredBy.id}`} className="text-blue-700 hover:underline">
              {customer.referredBy.name}
            </Link>{" "}
            고객
          </p>
        )}
        {customer.referrals.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            <span className="text-slate-400">이 고객이 소개한 고객 · </span>
            <ExpandableNameList items={customer.referrals} />
          </p>
        )}
        {customer.memo && (
          <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 whitespace-pre-wrap">
            {customer.memo}
          </div>
        )}
      </section>

      {/* 가족정보 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">가족정보</h2>
        <div className="space-y-2 mb-4">
          {customer.familyMembers.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              <div>
                <span className="font-medium text-slate-800">{f.relation}</span>
                {f.name && <span className="text-slate-600"> · {f.name}</span>}
                {f.birthDate && (
                  <span className="text-slate-400"> · {formatDate(f.birthDate)}</span>
                )}
                {f.memo && <span className="text-slate-500"> · {f.memo}</span>}
              </div>
              <form action={deleteFamilyMember.bind(null, customer.id, f.id)}>
                <button
                  type="submit"
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  삭제
                </button>
              </form>
            </div>
          ))}
          {customer.familyMembers.length === 0 && (
            <p className="text-sm text-slate-400">등록된 가족정보가 없습니다</p>
          )}
        </div>

        <form
          action={boundAddFamily}
          className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1">관계</label>
            <input
              name="relation"
              required
              placeholder="배우자/자녀 등"
              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">이름</label>
            <input
              name="name"
              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">생년월일</label>
            <input
              type="date"
              name="birthDate"
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-slate-500 mb-1">메모</label>
            <input
              name="memo"
              placeholder="예) 고3, 축구선수"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            추가
          </button>
        </form>
      </section>

      {/* 가입상품 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">가입상품</h2>
          <Link
            href={`/contracts/new?customerId=${customer.id}`}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            + 계약 추가
          </Link>
        </div>
        <div className="space-y-2">
          {customer.contracts.map((c) => {
            const dLeft = c.expiryDate ? daysUntil(c.expiryDate) : null;
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm"
              >
                <div>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium mr-1.5 ${
                      c.source === "AGENT_SALE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {c.source === "AGENT_SALE" ? "신규체결" : "기존상품"}
                  </span>
                  <span className="font-medium text-slate-800">{c.insurer}</span>
                  <span className="text-slate-600"> · {c.productName}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {formatDate(c.joinDate)} 가입 ~ {formatDate(c.expiryDate)} 만기
                  </span>
                </div>
                {dLeft !== null && dLeft <= 30 && dLeft >= 0 && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    만기 D-{dLeft}
                  </span>
                )}
                {dLeft !== null && dLeft < 0 && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                    만기됨
                  </span>
                )}
              </div>
            );
          })}
          {customer.contracts.length === 0 && (
            <p className="text-sm text-slate-400">등록된 계약이 없습니다</p>
          )}
        </div>
      </section>

      {/* 방문이력 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          방문이력 {completedVisits.length}차
        </h2>
        <div className="space-y-2">
          {completedVisits.map((e, i) => (
            <div key={e.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                {i + 1}차
              </span>
              <div>
                <span className="text-slate-500">
                  {formatDateTime(e.startAt)}
                  {e.area && ` · ${e.area}`}
                  {e.companion && ` · ${e.companion} 동반`}
                </span>
                {e.memo && <p className="text-slate-700 mt-0.5">{e.memo}</p>}
                <ChangeLogNote logs={e.changeLogs} />
              </div>
            </div>
          ))}
          {completedVisits.length === 0 && (
            <p className="text-sm text-slate-400">완료된 방문이 없습니다</p>
          )}

          {upcomingVisits.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-blue-50 px-3.5 py-2.5 text-sm border border-blue-100"
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                  예정
                </span>
                <div>
                  <span className="text-slate-500">
                    {formatDateTime(e.startAt)}
                    {e.area && ` · ${e.area}`}
                    {e.companion && ` · ${e.companion} 동반`}
                  </span>
                  {e.memo && <p className="text-slate-700 mt-0.5">{e.memo}</p>}
                  <ChangeLogNote logs={e.changeLogs} />
                </div>
              </div>
              <Link
                href={`/calendar/${e.id}/edit`}
                className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
              >
                수정
              </Link>
            </div>
          ))}

          {canceledVisits.map((e) => {
            const cancelLog = e.changeLogs.find((l) => l.action === "CANCELED");
            return (
              <div
                key={e.id}
                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm opacity-70"
              >
                <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                  취소됨
                </span>
                <div>
                  <span className="text-slate-500 line-through">
                    {formatDateTime(e.startAt)}
                    {e.area && ` · ${e.area}`}
                    {e.companion && ` · ${e.companion} 동반`}
                  </span>
                  {e.memo && <p className="text-slate-600 mt-0.5">{e.memo}</p>}
                  {cancelLog && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(cancelLog.createdAt)} 취소
                      {cancelLog.reason && ` · 사유: ${cancelLog.reason}`}
                    </p>
                  )}
                  <ChangeLogNote logs={e.changeLogs.filter((l) => l.action === "RESCHEDULED")} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 문자 발송이력 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            문자 발송이력 {customer.messages.length}건
          </h2>
          <Link href="/messages" className="text-xs font-medium text-blue-600 hover:underline">
            문자함에서 관리 →
          </Link>
        </div>
        <div className="space-y-2">
          {customer.messages.map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    m.status === "SENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : m.status === "PENDING"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {m.status === "SENT" ? "발송완료" : m.status === "PENDING" ? "대기중" : "취소됨"}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{m.triggerType}</span>
                <span>{formatDateTime(m.sentAt ?? m.createdAt)}</span>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {customer.messages.length === 0 && (
            <p className="text-sm text-slate-400">발송한 문자가 없습니다</p>
          )}
        </div>
      </section>

      {/* 상담이력 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          상담이력 {customer.consultations.length}건
        </h2>
        <div className="space-y-3">
          {customer.consultations.map((c) => (
            <div key={c.id} className="border-l-2 border-blue-200 pl-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{formatDateTime(c.createdAt)}</span>
                {c.resultType && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                    {c.resultType.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                {c.content}
              </p>
              {c.nextContactDate && (
                <p className="text-xs text-slate-400 mt-1">
                  다음 연락일: {formatDate(c.nextContactDate)}
                </p>
              )}
            </div>
          ))}
          {customer.consultations.length === 0 && (
            <p className="text-sm text-slate-400">상담이력이 없습니다</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ChangeLogNote({
  logs,
}: {
  logs: { id: string; action: string; previousStartAt: Date | null; newStartAt: Date | null; reason: string | null; createdAt: Date }[];
}) {
  const reschedules = logs.filter((l) => l.action === "RESCHEDULED");
  if (reschedules.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {reschedules.map((l) => (
        <p key={l.id} className="text-[11px] text-slate-400">
          🔄 {formatDateTime(l.previousStartAt)} → {formatDateTime(l.newStartAt)} 변경
          {l.reason && ` · 사유: ${l.reason}`}
          {` (${formatDateTime(l.createdAt)})`}
        </p>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-24 text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
