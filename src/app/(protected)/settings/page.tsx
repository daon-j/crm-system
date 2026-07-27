import { prisma } from "@/lib/prisma";
import {
  createCallResultType,
  deleteCallResultType,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
} from "@/lib/actions/settings";
import { updateProfile } from "@/lib/actions/auth";
import { moveDashboardSection, toggleDashboardSection } from "@/lib/actions/dashboardLayout";
import { getDashboardLayout, DASHBOARD_SECTIONS } from "@/lib/dashboardLayout";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const user = await requireUser();

  const [resultTypes, templates, dashboardLayout] = await Promise.all([
    prisma.callResultType.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { messageTemplate: true },
    }),
    prisma.messageTemplate.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: { createdAt: "asc" },
    }),
    getDashboardLayout(user.id),
  ]);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">설정</h1>
        <p className="text-sm text-slate-500">
          콜 결과 유형과 문자 템플릿을 자유롭게 추가하거나 삭제할 수 있습니다.
        </p>
      </div>

      {/* 내 계정 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">내 계정</h2>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <p>
              <span className="text-slate-400">이메일 · </span>
              <span className="text-slate-700">{user.email}</span>
            </p>
            <p>
              <span className="text-slate-400">가입일 · </span>
              <span className="text-slate-700">{formatDate(user.createdAt)}</span>
            </p>
          </div>
          <form action={updateProfile} className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">이름</label>
              <input
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="예) 홍길동"
                className="w-32 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">전화번호</label>
              <input
                name="phone"
                defaultValue={user.phone ?? ""}
                placeholder="010-0000-0000"
                className="w-36 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">내선번호</label>
              <input
                name="extension"
                defaultValue={user.extension ?? ""}
                placeholder="예) 1234"
                className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              저장
            </button>
          </form>
          <p className="text-xs text-slate-400">
            이름/전화번호/내선번호는 문자 템플릿의 {"{{설계사명}}"}, {"{{설계사전화번호}}"}, {"{{설계사내선번호}}"}에 자동으로 채워집니다.
          </p>
        </div>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </section>

      {/* 대시보드 구성 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">대시보드 구성</h2>
        <p className="text-xs text-slate-400 mb-3">
          순서를 바꾸거나 필요 없는 영역은 꺼두세요.
        </p>
        <div className="space-y-2">
          {dashboardLayout.order.map((key, i) => {
            const meta = DASHBOARD_SECTIONS.find((s) => s.key === key);
            const isHidden = dashboardLayout.hidden.includes(key);
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
              >
                <span className={isHidden ? "text-slate-400" : "text-slate-800"}>{meta?.label ?? key}</span>
                <div className="flex items-center gap-3">
                  <form action={moveDashboardSection.bind(null, key, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="위로"
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                    >
                      ▲
                    </button>
                  </form>
                  <form action={moveDashboardSection.bind(null, key, "down")}>
                    <button
                      type="submit"
                      disabled={i === dashboardLayout.order.length - 1}
                      aria-label="아래로"
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                    >
                      ▼
                    </button>
                  </form>
                  <form action={toggleDashboardSection.bind(null, key)}>
                    <button
                      type="submit"
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        isHidden ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isHidden ? "숨김" : "표시중"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 콜결과유형 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">콜 결과 유형</h2>
        <div className="space-y-2 mb-4">
          {resultTypes.map((rt) => (
            <div
              key={rt.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{rt.name}</span>
                {rt.isDefault && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">기본</span>
                )}
                {rt.messageTemplate && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">
                    → {rt.messageTemplate.name}
                  </span>
                )}
                {rt.createsCalendarEvent && (
                  <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">
                    캘린더 자동등록
                  </span>
                )}
              </div>
              {rt.userId && (
                <form action={deleteCallResultType.bind(null, rt.id)}>
                  <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                    삭제
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <form
          action={createCallResultType}
          className="flex flex-wrap gap-2 items-end rounded-xl border border-slate-200 bg-white p-4"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1">결과 유형 이름</label>
            <input
              name="name"
              required
              placeholder="예) 재상담 필요"
              className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">연결할 문자템플릿</label>
            <select
              name="messageTemplateId"
              defaultValue=""
              className="w-48 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            >
              <option value="">없음</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 pb-1.5">
            <input type="checkbox" name="createsCalendarEvent" className="rounded border-slate-300" />
            캘린더에 방문일정 자동등록
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            추가
          </button>
        </form>
      </section>

      {/* 문자템플릿 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">문자 템플릿</h2>
        <p className="text-xs text-slate-400 mb-3">
          {"{{고객명}}, {{설계사명}}, {{설계사전화번호}}, {{설계사내선번호}}, {{방문일시}}, {{상품명}}, {{만기일}}"} 같은 변수를 문구 안에 넣으면 발송 시 자동으로 채워집니다.
        </p>
        <div className="space-y-3 mb-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-800">{t.name}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                    {t.category}
                  </span>
                </div>
                {t.userId && (
                  <form action={deleteMessageTemplate.bind(null, t.id)}>
                    <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                      삭제
                    </button>
                  </form>
                )}
              </div>
              {t.userId ? (
                <form action={updateMessageTemplate.bind(null, t.id)} className="flex gap-2">
                  <textarea
                    name="body"
                    defaultValue={t.body}
                    rows={2}
                    className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap self-start"
                  >
                    저장
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{t.body}</p>
              )}
            </div>
          ))}
        </div>

        <form
          action={createMessageTemplate}
          className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="템플릿 이름"
              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <input
              name="category"
              required
              placeholder="카테고리 (예: 재상담)"
              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <textarea
            name="body"
            required
            rows={2}
            placeholder="문구 내용을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            템플릿 추가
          </button>
        </form>
      </section>
    </div>
  );
}
