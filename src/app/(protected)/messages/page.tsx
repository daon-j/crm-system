import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatPhone } from "@/lib/format";
import {
  cancelMessage,
  updateMessageContent,
  runGenerateAutoMessages,
} from "@/lib/actions/messages";
import CopyButton from "@/components/CopyButton";
import KakaoShareButton from "@/components/KakaoShareButton";
import SendCompleteButton from "@/components/SendCompleteButton";
import { requireUser } from "@/lib/auth";
import { agentVars, previewFill, sortCategories } from "@/lib/messageTemplate";
import MessageQuickPicksMobile from "@/components/MessageQuickPicksMobile";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export default async function MessagesPage() {
  const user = await requireUser();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [pending, sent, templates] = await Promise.all([
    prisma.message.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { customer: true },
    }),
    prisma.message.findMany({
      where: { userId: user.id, status: "SENT", sentAt: { gte: oneMonthAgo } },
      orderBy: { sentAt: "desc" },
      include: { customer: true },
    }),
    prisma.messageTemplate.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">문자함</h1>
        <div className="flex gap-2">
          <Link
            href="/messages/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            + 새 문자 작성
          </Link>
          <form action={runGenerateAutoMessages}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-muted"
            >
              🔄 생일·안부·만기 대상 갱신
            </button>
          </form>
        </div>
      </div>
      <p className="text-sm text-ink-muted mb-6">
        문구를 최종 확인한 뒤 발송하면 발송완료로 이동합니다.
      </p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">주요 문자 바로가기</h2>
        <span className="text-xs text-ink-muted hidden lg:inline">예시 고객으로 채운 실제 발송 문구예요</span>
      </div>

      {/* 모바일: 카테고리 필터 탭 + 세로 1단 카드 */}
      <div className="lg:hidden mb-10">
        <MessageQuickPicksMobile
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            preview: previewFill(t.body, agentVars(user)),
          }))}
          categories={sortCategories([...new Set(templates.map((t) => t.category))])}
        />
      </div>

      {/* PC: 카테고리별 순차 나열 + 2단 그리드 (기존 그대로) */}
      <div className="hidden lg:block space-y-6 mb-10">
        {sortCategories([...new Set(templates.map((t) => t.category))]).map((category) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-ink-muted mb-2">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates
                .filter((t) => t.category === category)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/messages/new?templateId=${t.id}`}
                    className="rounded-xl border border-border bg-surface p-3.5 hover:border-primary/40 hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-ink">{t.name}</span>
                    <p className="mt-1.5 rounded-lg bg-surface-muted px-2.5 py-2 text-xs leading-relaxed text-ink-2 whitespace-pre-wrap">
                      {previewFill(t.body, agentVars(user))}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-ink mb-3">
        발송대기 {pending.length}건
      </h2>
      <div className="space-y-3 mb-10">
        {pending.map((m) => {
          const phoneDigits = m.customer.phone?.replace(/[^0-9]/g, "");
          return (
            <div key={m.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                <span className="font-medium text-ink-2">{m.customer.name}</span>
                {m.customer.phone && <span>{formatPhone(m.customer.phone)}</span>}
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                  {m.triggerType}
                </span>
              </div>

              <form action={updateMessageContent.bind(null, m.id)} className="flex gap-2 items-start">
                <textarea
                  name="content"
                  defaultValue={m.content}
                  rows={2}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink-2 hover:bg-surface-muted whitespace-nowrap"
                >
                  문구 저장
                </button>
              </form>

              <div className="flex flex-wrap gap-2 mt-2.5">
                {phoneDigits && (
                  <a
                    href={`sms:${phoneDigits}?body=${encodeURIComponent(m.content)}`}
                    className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-1.5 text-xs font-medium text-success hover:opacity-90"
                  >
                    📱 문자 앱으로 보내기
                  </a>
                )}
                <CopyButton text={m.content} />
                <KakaoShareButton content={m.content} appKey={KAKAO_JS_KEY} />
                <SendCompleteButton messageId={m.id} customerName={m.customer.name} />
                <form action={cancelMessage.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
                  >
                    취소
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && (
          <p className="text-sm text-ink-muted">발송 대기중인 문자가 없습니다</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink">최근 1개월 발송완료 {sent.length}건</h2>
        <Link href="/messages/history" className="text-xs font-medium text-primary hover:underline">
          지난 발송이력 전체보기 →
        </Link>
      </div>
      <div className="space-y-2">
        {sent.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-border bg-surface-muted px-3.5 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
              <span className="font-medium text-ink-2">{m.customer.name}</span>
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-ink-muted">
                {m.triggerType}
              </span>
              <span>{formatDateTime(m.sentAt)} 발송</span>
            </div>
            <p className="text-ink-2">{m.content}</p>
          </div>
        ))}
        {sent.length === 0 && (
          <p className="text-sm text-ink-muted">최근 1개월간 발송완료 이력이 없습니다</p>
        )}
      </div>
    </div>
  );
}
