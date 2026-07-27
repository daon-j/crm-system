import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, toDateInputValue } from "@/lib/format";
import { createStudyNote, deleteStudyNote } from "@/lib/actions/notes";
import { categoryLabel, categoryStyle } from "@/lib/noteCategory";
import FileAttachDropzone from "@/components/FileAttachDropzone";
import CategoryChips from "@/components/CategoryChips";
import { requireUser } from "@/lib/auth";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await requireUser();
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";

  const [notes, distinctCategories] = await Promise.all([
    prisma.studyNote.findMany({
      where: {
        AND: [
          { userId: user.id },
          category ? { category } : {},
          query
            ? {
                OR: [
                  { title: { contains: query } },
                  { content: { contains: query } },
                  { tags: { contains: query } },
                  { attachments: { some: { type: "TRANSCRIPT", content: { contains: query } } } },
                ],
              }
            : {},
        ],
      },
      include: { attachments: { orderBy: { createdAt: "asc" } } },
      orderBy: { date: "desc" },
    }),
    prisma.studyNote.findMany({
      where: { userId: user.id },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const categoryLabels = Array.from(new Set(distinctCategories.map((c) => categoryLabel(c.category)))).sort();

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
          <div>
            <label className="block text-xs text-slate-500 mb-1">날짜</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={toDateInputValue(new Date())}
              className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">구분</label>
            <CategoryChips
              key={`create-cat-${notes.length}`}
              name="category"
              options={categoryLabels}
              defaultValue="정보미팅"
            />
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
          <div className="border-t border-slate-100 pt-3">
            <FileAttachDropzone key={`create-${notes.length}`} />
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
          {distinctCategories.map((c) => (
            <option key={c.category} value={c.category}>
              {categoryLabel(c.category)}
            </option>
          ))}
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
                <span className={`rounded px-1.5 py-0.5 ${categoryStyle(n.category)}`}>
                  {categoryLabel(n.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/notes/${n.id}/edit`} className="text-xs text-slate-400 hover:text-blue-600">
                  수정
                </Link>
                <form action={deleteStudyNote.bind(null, n.id)}>
                  <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                    삭제
                  </button>
                </form>
              </div>
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

            {n.attachments.some((a) => a.type === "IMAGE") && (
              <div className="flex flex-wrap gap-2 mt-3">
                {n.attachments
                  .filter((a) => a.type === "IMAGE")
                  .map((a) => (
                    <a key={a.id} href={a.filePath!} target="_blank" rel="noreferrer">
                      <img
                        src={a.filePath!}
                        alt={a.originalName}
                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  ))}
              </div>
            )}

            {n.attachments
              .filter((a) => a.type === "AUDIO")
              .map((a) => (
                <audio key={a.id} controls src={a.filePath!} className="mt-3 h-9 max-w-full" />
              ))}

            {n.attachments
              .filter((a) => a.type === "TRANSCRIPT")
              .map((a) => (
                <div key={a.id} className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium text-slate-500">📝 대본</span>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                </div>
              ))}

            {n.attachments
              .filter((a) => a.type === "FILE")
              .map((a) => (
                <a
                  key={a.id}
                  href={a.filePath!}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  📎 {a.originalName}
                </a>
              ))}
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-slate-400">기록된 노트가 없습니다</p>
        )}
      </div>
    </div>
  );
}
