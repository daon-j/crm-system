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
import { formatDate, toDateInputValue } from "@/lib/format";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import ThemeToggle from "@/components/ThemeToggle";

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
        <h1 className="text-2xl font-bold text-ink mb-1">설정</h1>
        <p className="text-sm text-ink-muted">
          콜 결과 유형과 문자 템플릿을 자유롭게 추가하거나 삭제할 수 있습니다.
        </p>
      </div>

      {/* 화면 테마 */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">화면 테마</h2>
        <div className="max-w-xs rounded-xl border border-border bg-surface p-4">
          <ThemeToggle />
          <p className="text-xs text-ink-muted mt-2">시스템 설정을 고르면 기기의 라이트/다크 설정을 따라갑니다.</p>
        </div>
      </section>

      {/* 내 계정 */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">내 계정</h2>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <p>
              <span className="text-ink-muted">이메일 · </span>
              <span className="text-ink-2">{user.email}</span>
            </p>
            <p>
              <span className="text-ink-muted">가입일 · </span>
              <span className="text-ink-2">{formatDate(user.createdAt)}</span>
            </p>
          </div>
          <form action={updateProfile} className="flex flex-wrap gap-2 items-end border-t border-border pt-4">
            <div>
              <label className="block text-xs text-ink-muted mb-1">이름</label>
              <input
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="예) 홍길동"
                className="w-32 rounded-lg border border-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">전화번호</label>
              <input
                name="phone"
                defaultValue={user.phone ?? ""}
                placeholder="010-0000-0000"
                className="w-36 rounded-lg border border-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">내선번호</label>
              <input
                name="extension"
                defaultValue={user.extension ?? ""}
                placeholder="예) 1234"
                className="w-24 rounded-lg border border-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">
                생년월일 <span className="text-ink-muted font-normal">(선택)</span>
              </label>
              <input
                type="date"
                name="birthDate"
                defaultValue={toDateInputValue(user.birthDate)}
                className="w-36 rounded-lg border border-border px-2.5 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-ink-ink hover:opacity-90"
            >
              저장
            </button>
          </form>
          <p className="text-xs text-ink-muted">
            이름/전화번호/내선번호는 문자 템플릿의 {"{{설계사명}}"}, {"{{설계사전화번호}}"}, {"{{설계사내선번호}}"}에 자동으로 채워집니다.
          </p>
        </div>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </section>

      {/* 대시보드 구성 */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">대시보드 구성</h2>
        <p className="text-xs text-ink-muted mb-3">
          순서를 바꾸거나 필요 없는 영역은 꺼두세요.
        </p>
        <div className="space-y-2">
          {dashboardLayout.order.map((key, i) => {
            const meta = DASHBOARD_SECTIONS.find((s) => s.key === key);
            const isHidden = dashboardLayout.hidden.includes(key);
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
              >
                <span className={isHidden ? "text-ink-muted" : "text-ink"}>{meta?.label ?? key}</span>
                <div className="flex items-center gap-3">
                  <form action={moveDashboardSection.bind(null, key, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="위로"
                      className="text-ink-muted hover:text-ink-2 disabled:opacity-30 disabled:hover:text-ink-muted"
                    >
                      ▲
                    </button>
                  </form>
                  <form action={moveDashboardSection.bind(null, key, "down")}>
                    <button
                      type="submit"
                      disabled={i === dashboardLayout.order.length - 1}
                      aria-label="아래로"
                      className="text-ink-muted hover:text-ink-2 disabled:opacity-30 disabled:hover:text-ink-muted"
                    >
                      ▼
                    </button>
                  </form>
                  <form action={toggleDashboardSection.bind(null, key)}>
                    <button
                      type="submit"
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        isHidden ? "bg-surface-muted text-ink-muted" : "bg-success-soft text-success"
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
        <h2 className="text-sm font-semibold text-ink mb-3">콜 결과 유형</h2>
        <div className="space-y-2 mb-4">
          {resultTypes.map((rt) => (
            <div
              key={rt.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{rt.name}</span>
                {rt.isDefault && (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">기본</span>
                )}
                {rt.messageTemplate && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                    → {rt.messageTemplate.name}
                  </span>
                )}
                {rt.createsCalendarEvent && (
                  <span className="rounded bg-info-soft px-1.5 py-0.5 text-[11px] text-info">
                    캘린더 자동등록
                  </span>
                )}
              </div>
              {rt.userId && (
                <form action={deleteCallResultType.bind(null, rt.id)}>
                  <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                    삭제
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <form
          action={createCallResultType}
          className="flex flex-wrap gap-2 items-end rounded-xl border border-border bg-surface p-4"
        >
          <div>
            <label className="block text-xs text-ink-muted mb-1">결과 유형 이름</label>
            <input
              name="name"
              required
              placeholder="예) 재상담 필요"
              className="w-40 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">연결할 문자템플릿</label>
            <select
              name="messageTemplateId"
              defaultValue=""
              className="w-48 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            >
              <option value="">없음</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-sm text-ink-2 pb-1.5">
            <input type="checkbox" name="createsCalendarEvent" className="rounded border-border" />
            캘린더에 방문일정 자동등록
          </label>
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-ink-ink hover:opacity-90"
          >
            추가
          </button>
        </form>
      </section>

      {/* 문자템플릿 */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">문자 템플릿</h2>
        <p className="text-xs text-ink-muted mb-3">
          {"{{고객명}}, {{설계사명}}, {{설계사전화번호}}, {{설계사내선번호}}, {{방문일시}}, {{상품명}}, {{만기일}}"} 같은 변수를 문구 안에 넣으면 발송 시 자동으로 채워집니다.
        </p>
        <div className="space-y-3 mb-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-surface p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-ink">{t.name}</span>
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">
                    {t.category}
                  </span>
                  {!t.userId && (
                    <span className="rounded bg-info-soft px-1.5 py-0.5 text-[11px] text-info">공용</span>
                  )}
                </div>
                {t.userId && (
                  <form action={deleteMessageTemplate.bind(null, t.id)}>
                    <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                      삭제
                    </button>
                  </form>
                )}
              </div>
              <form action={updateMessageTemplate.bind(null, t.id)}>
                <textarea
                  name="body"
                  defaultValue={t.body}
                  rows={7}
                  className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm mb-2"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  변경사항 저장
                </button>
              </form>
              {!t.userId && (
                <p className="text-[11px] text-ink-muted mt-1">
                  공용 템플릿이라 수정하면 이 템플릿을 쓰는 모든 계정에 함께 반영됩니다.
                </p>
              )}
            </div>
          ))}
        </div>

        <form
          action={createMessageTemplate}
          className="space-y-2 rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="템플릿 이름"
              className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
            <input
              name="category"
              required
              placeholder="카테고리 (예: 재상담)"
              className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm"
            />
          </div>
          <textarea
            name="body"
            required
            rows={5}
            defaultValue={"\n\nDB손해보험 보상청구서비스담당자 {{설계사명}}\n{{설계사전화번호}}\n{{설계사내선번호}}"}
            placeholder="문구 내용을 입력하세요"
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
          <p className="text-[11px] text-ink-muted">서명 3줄이 미리 채워져 있어요. 맨 위에 본문 내용만 입력하면 됩니다.</p>
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-ink-ink hover:opacity-90"
          >
            템플릿 추가
          </button>
        </form>
      </section>
    </div>
  );
}
