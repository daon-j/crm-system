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
        <h1 className="text-2xl font-bold text-slate-900">문자함</h1>
        <div className="flex gap-2">
          <Link
            href="/messages/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 새 문자 작성
          </Link>
          <form action={runGenerateAutoMessages}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              🔄 생일·안부·만기 대상 갱신
            </button>
          </form>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        문구를 최종 확인한 뒤 발송하면 발송완료로 이동합니다.
      </p>

      <h2 className="text-sm font-semibold text-slate-900 mb-3">주요 문자 바로가기</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-10">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/messages/new?templateId=${t.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-medium text-slate-800">{t.name}</span>
            </div>
            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500 mb-1.5">
              {t.category}
            </span>
            <p className="text-xs text-slate-400 line-clamp-2">{t.body}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-900 mb-3">
        발송대기 {pending.length}건
      </h2>
      <div className="space-y-3 mb-10">
        {pending.map((m) => {
          const phoneDigits = m.customer.phone?.replace(/[^0-9]/g, "");
          return (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span className="font-medium text-slate-700">{m.customer.name}</span>
                {m.customer.phone && <span>{formatPhone(m.customer.phone)}</span>}
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                  {m.triggerType}
                </span>
                <span>{formatDateTime(m.createdAt)}</span>
              </div>

              <form action={updateMessageContent.bind(null, m.id)} className="flex gap-2 items-start">
                <textarea
                  name="content"
                  defaultValue={m.content}
                  rows={2}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                >
                  문구 저장
                </button>
              </form>

              <div className="flex flex-wrap gap-2 mt-2.5">
                {phoneDigits && (
                  <a
                    href={`sms:${phoneDigits}?body=${encodeURIComponent(m.content)}`}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
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
                    className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  >
                    취소
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && (
          <p className="text-sm text-slate-400">발송 대기중인 문자가 없습니다</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">최근 1개월 발송완료 {sent.length}건</h2>
        <Link href="/messages/history" className="text-xs font-medium text-blue-600 hover:underline">
          지난 발송이력 전체보기 →
        </Link>
      </div>
      <div className="space-y-2">
        {sent.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-600">{m.customer.name}</span>
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-500">
                {m.triggerType}
              </span>
              <span>{formatDateTime(m.sentAt)} 발송</span>
            </div>
            <p className="text-slate-600">{m.content}</p>
          </div>
        ))}
        {sent.length === 0 && (
          <p className="text-sm text-slate-400">최근 1개월간 발송완료 이력이 없습니다</p>
        )}
      </div>
    </div>
  );
}
