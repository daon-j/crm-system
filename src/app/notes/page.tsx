import { prisma } from "@/lib/prisma";
import { formatDate, toDateInputValue } from "@/lib/format";
import { createStudyNote, deleteStudyNote } from "@/lib/actions/notes";

const CATEGORY_LABEL: Record<string, string> = {
  MORNING_MEETING: "정보미팅",
  MORNING_TRAINING: "오전교육",
  ETC: "기타",
};

const CATEGORY_STYLE: Record<string, string> = {
  MORNING_MEETING: "bg-blue-100 text-blue-700",
  MORNING_TRAINING: "bg-emerald-100 text-emerald-700",
  ETC: "bg-slate-100 text-slate-600",
};

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";

  const notes = await prisma.studyNote.findMany({
    where: {
      AND: [
        category ? { category } : {},
        query
          ? {
              OR: [
                { title: { contains: query } },
                { content: { contains: query } },
                { tags: { contains: query } },
              ],
            }
          : {},
      ],
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">학습노트</h1>
      <p className="text-sm text-slate-500 mb-6">
        정보미팅·오전교육 내용을 기록하고 나중에 검색해서 복습하세요.
      </p>

      <details className="mb-6" open={notes.length === 0}>
        <summary className="cursor-pointer text-sm font-medium text-blue-600">
          + 오늘 내용 기록하기
        </summary>
        <form
          action={createStudyNote}
          className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">날짜</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={toDateInputValue(new Date())}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">구분</label>
              <select
                name="category"
                defaultValue="MORNING_MEETING"
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                <option value="MORNING_MEETING">정보미팅</option>
                <option value="MORNING_TRAINING">오전교육</option>
                <option value="ETC">기타</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">제목</label>
            <input
              name="title"
              required
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">내용</label>
            <textarea
              name="content"
              required
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">태그 (콤마로 구분)</label>
            <input
              name="tags"
              placeholder="예) 실손보험, 세법개정"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            저장
          </button>
        </form>
      </details>

      <form method="GET" className="flex gap-2 mb-5">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="제목, 내용, 태그로 검색"
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">전체</option>
          <option value="MORNING_MEETING">정보미팅</option>
          <option value="MORNING_TRAINING">오전교육</option>
          <option value="ETC">기타</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          검색
        </button>
      </form>

      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{formatDate(n.date)}</span>
                <span className={`rounded px-1.5 py-0.5 ${CATEGORY_STYLE[n.category] ?? CATEGORY_STYLE.ETC}`}>
                  {CATEGORY_LABEL[n.category] ?? n.category}
                </span>
              </div>
              <form action={deleteStudyNote.bind(null, n.id)}>
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  삭제
                </button>
              </form>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-2">{n.title}</h3>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.content}</p>
            {n.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {n.tags.split(",").map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-slate-400">기록된 노트가 없습니다</p>
        )}
      </div>
    </div>
  );
}
