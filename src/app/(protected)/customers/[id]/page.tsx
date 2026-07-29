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
      <Link href="/customers" className="text-sm text-ink-muted hover:underline">
        ← 고객목록
      </Link>
      <div className="mb-6 mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-ink">{customer.name}</h1>
            <span className="text-sm font-medium text-accent">{customer.grade}등급</span>
            {customer.batch && (
              <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-2">
                {customer.batch.name}
              </span>
            )}
            {completedVisits.length > 0 && (
              <span className="rounded bg-info-soft px-2 py-0.5 text-xs font-medium text-info">
                방문{completedVisits.length}차
              </span>
            )}
            {hasContract && (
              <span className="rounded bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                체결
              </span>
            )}
            {customer.referredBy && (
              <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                소개
              </span>
            )}
            {!customer.mobileConsent && (
              <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                📱 모바일 미동의
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">{GRADE_LABEL[customer.grade]}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/calls?customerId=${customer.id}`}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover sm:flex-none"
          >
            콜 상담 기록하기
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-ink-2 hover:bg-surface-muted sm:flex-none"
          >
            수정
          </Link>
          <form action={boundDeleteCustomer} className="flex-1 sm:flex-none">
            <button
              type="submit"
              className="w-full rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              삭제
            </button>
          </form>
        </div>
      </div>

      {!customer.mobileConsent && (
        <div className="mb-6 rounded-xl border-2 border-danger/40 bg-danger-soft px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-danger">📱 모바일 미동의 고객입니다</p>
            <p className="text-xs text-danger/80 mt-0.5">
              모바일동의가 있어야 내부 시스템에서 고객정보 조회 및 가입설계가 가능합니다. 방문 시 꼭 동의를 받아주세요.
            </p>
          </div>
          <Link
            href={`/customers/${customer.id}/edit`}
            className="shrink-0 rounded-lg bg-danger px-3.5 py-1.5 text-xs font-medium text-danger-ink hover:opacity-90 whitespace-nowrap"
          >
            동의 처리하기 →
          </Link>
        </div>
      )}

      {/* 기본정보 */}
      <section className="rounded-xl border border-border bg-surface p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-4">기본정보</h2>
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
          <p className="mt-3 text-sm text-ink-2">
            <span className="text-ink-muted">소개자 · </span>
            <Link href={`/customers/${customer.referredBy.id}`} className="text-primary hover:underline">
              {customer.referredBy.name}
            </Link>{" "}
            고객
          </p>
        )}
        {customer.referrals.length > 0 && (
          <p className="mt-1 text-sm text-ink-2">
            <span className="text-ink-muted">이 고객이 소개한 고객 · </span>
            <ExpandableNameList items={customer.referrals} />
          </p>
        )}
        {customer.memo && (
          <div className="mt-4 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm text-ink-2 whitespace-pre-wrap">
            {customer.memo}
          </div>
        )}
      </section>

      {/* 가족정보 */}
      <section className="rounded-xl border border-border bg-surface p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-4">가족정보</h2>
        <div className="space-y-2 mb-4">
          {customer.familyMembers.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm"
            >
              <div>
                <span className="font-medium text-ink">{f.relation}</span>
                {f.name && <span className="text-ink-2"> · {f.name}</span>}
                {f.birthDate && (
                  <span className="text-ink-muted"> · {formatDate(f.birthDate)}</span>
                )}
                {f.memo && <span className="text-ink-muted"> · {f.memo}</span>}
              </div>
              <form action={deleteFamilyMember.bind(null, customer.id, f.id)}>
                <button
                  type="submit"
                  className="text-xs text-ink-muted hover:text-danger"
                >
                  삭제
                </button>
              </form>
            </div>
          ))}
          {customer.familyMembers.length === 0 && (
            <p className="text-sm text-ink-muted">등록된 가족정보가 없습니다</p>
          )}
        </div>

        <form
          action={boundAddFamily}
          className="flex flex-wrap gap-2 items-end border-t border-border pt-4"
        >
          <div>
            <label className="block text-xs text-ink-muted mb-1">관계</label>
            <input
              name="relation"
              required
              placeholder="배우자/자녀 등"
              className="w-28 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">이름</label>
            <input
              name="name"
              className="w-28 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">생년월일</label>
            <input
              type="date"
              name="birthDate"
              className="rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-ink-muted mb-1">메모</label>
            <input
              name="memo"
              placeholder="예) 고3, 축구선수"
              className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            추가
          </button>
        </form>
      </section>

      {/* 가입상품 */}
      <section className="rounded-xl border border-border bg-surface p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">가입상품</h2>
          <Link
            href={`/contracts/new?customerId=${customer.id}`}
            className="text-xs font-medium text-primary hover:underline"
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
                className="flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm"
              >
                <div>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium mr-1.5 ${
                      c.source === "AGENT_SALE"
                        ? "bg-success-soft text-success"
                        : "bg-border/50 text-ink-muted"
                    }`}
                  >
                    {c.source === "AGENT_SALE" ? "신규체결" : "기존상품"}
                  </span>
                  <span className="font-medium text-ink">{c.insurer}</span>
                  <span className="text-ink-2"> · {c.productName}</span>
                  <span className="text-ink-muted">
                    {" "}
                    · {formatDate(c.joinDate)} 가입 ~ {formatDate(c.expiryDate)} 만기
                  </span>
                </div>
                {dLeft !== null && dLeft <= 30 && dLeft >= 0 && (
                  <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    만기 D-{dLeft}
                  </span>
                )}
                {dLeft !== null && dLeft < 0 && (
                  <span className="rounded bg-border/50 px-2 py-0.5 text-xs font-medium text-ink-muted">
                    만기됨
                  </span>
                )}
              </div>
            );
          })}
          {customer.contracts.length === 0 && (
            <p className="text-sm text-ink-muted">등록된 계약이 없습니다</p>
          )}
        </div>
      </section>

      {/* 방문이력 */}
      <section className="rounded-xl border border-border bg-surface p-5 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-4">
          방문이력 {completedVisits.length}차
        </h2>
        <div className="space-y-2">
          {completedVisits.map((e, i) => (
            <div key={e.id} className="flex items-start gap-2 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm">
              <span className="shrink-0 rounded bg-info-soft px-1.5 py-0.5 text-xs font-medium text-info">
                {i + 1}차
              </span>
              <div>
                <span className="text-ink-muted">
                  {formatDateTime(e.startAt)}
                  {e.area && ` · ${e.area}`}
                  {e.companion && ` · ${e.companion} 동반`}
                </span>
                {e.memo && <p className="text-ink-2 mt-0.5">{e.memo}</p>}
                <ChangeLogNote logs={e.changeLogs} />
              </div>
            </div>
          ))}
          {completedVisits.length === 0 && (
            <p className="text-sm text-ink-muted">완료된 방문이 없습니다</p>
          )}

          {upcomingVisits.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-info-soft px-3.5 py-2.5 text-sm border border-info/20"
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-xs font-medium text-info">
                  예정
                </span>
                <div>
                  <span className="text-ink-muted">
                    {formatDateTime(e.startAt)}
                    {e.area && ` · ${e.area}`}
                    {e.companion && ` · ${e.companion} 동반`}
                  </span>
                  {e.memo && <p className="text-ink-2 mt-0.5">{e.memo}</p>}
                  <ChangeLogNote logs={e.changeLogs} />
                </div>
              </div>
              <Link
                href={`/calendar/${e.id}/edit`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
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
                className="flex items-start gap-2 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm opacity-70"
              >
                <span className="shrink-0 rounded bg-danger-soft px-1.5 py-0.5 text-xs font-medium text-danger">
                  취소됨
                </span>
                <div>
                  <span className="text-ink-muted line-through">
                    {formatDateTime(e.startAt)}
                    {e.area && ` · ${e.area}`}
                    {e.companion && ` · ${e.companion} 동반`}
                  </span>
                  {e.memo && <p className="text-ink-2 mt-0.5">{e.memo}</p>}
                  {cancelLog && (
                    <p className="text-[11px] text-ink-muted mt-0.5">
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
      <section className="rounded-xl border border-border bg-surface p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">
            문자 발송이력 {customer.messages.length}건
          </h2>
          <Link href="/messages" className="text-xs font-medium text-primary hover:underline">
            문자함에서 관리 →
          </Link>
        </div>
        <div className="space-y-2">
          {customer.messages.map((m) => (
            <div key={m.id} className="rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    m.status === "SENT"
                      ? "bg-success-soft text-success"
                      : m.status === "PENDING"
                        ? "bg-info-soft text-info"
                        : "bg-border/50 text-ink-muted"
                  }`}
                >
                  {m.status === "SENT" ? "발송완료" : m.status === "PENDING" ? "대기중" : "취소됨"}
                </span>
                <span className="rounded bg-surface px-1.5 py-0.5 text-ink-muted">{m.triggerType}</span>
                <span>{formatDateTime(m.sentAt ?? m.createdAt)}</span>
              </div>
              <p className="text-ink-2 whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {customer.messages.length === 0 && (
            <p className="text-sm text-ink-muted">발송한 문자가 없습니다</p>
          )}
        </div>
      </section>

      {/* 상담이력 */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">
          상담이력 {customer.consultations.length}건
        </h2>
        <div className="space-y-3">
          {customer.consultations.map((c) => (
            <div key={c.id} className="border-l-2 border-border pl-3.5">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span>{formatDateTime(c.createdAt)}</span>
                {c.resultType && (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-ink-2">
                    {c.resultType.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-2 mt-1 whitespace-pre-wrap">
                {c.content}
              </p>
              {c.nextContactDate && (
                <p className="text-xs text-ink-muted mt-1">
                  다음 연락일: {formatDate(c.nextContactDate)}
                </p>
              )}
            </div>
          ))}
          {customer.consultations.length === 0 && (
            <p className="text-sm text-ink-muted">상담이력이 없습니다</p>
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
        <p key={l.id} className="text-[11px] text-ink-muted">
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
      <dt className="w-24 text-ink-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
