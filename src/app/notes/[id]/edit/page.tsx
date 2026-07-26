import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/format";
import { updateStudyNote, deleteNoteAttachment } from "@/lib/actions/notes";
import { categoryLabel } from "@/lib/noteCategory";
import FileAttachDropzone from "@/components/FileAttachDropzone";
import CategoryChips from "@/components/CategoryChips";

export default async function EditStudyNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [note, distinctCategories] = await Promise.all([
    prisma.studyNote.findUnique({
      where: { id },
      include: { attachments: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.studyNote.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);
  if (!note) notFound();

  const categoryLabels = Array.from(new Set(distinctCategories.map((c) => categoryLabel(c.category)))).sort();
  const boundUpdate = updateStudyNote.bind(null, note.id);
  const images = note.attachments.filter((a) => a.type === "IMAGE");
  const audios = note.attachments.filter((a) => a.type === "AUDIO");
  const transcripts = note.attachments.filter((a) => a.type === "TRANSCRIPT");
  const files = note.attachments.filter((a) => a.type === "FILE");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">노트 수정</h1>
        <Link href="/notes" className="text-sm text-slate-500 hover:underline">
          ← 목록으로
        </Link>
      </div>

      <form
        action={boundUpdate}
        className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">날짜</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={toDateInputValue(note.date)}
            className="w-40 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">구분</label>
          <CategoryChips name="category" options={categoryLabels} defaultValue={categoryLabel(note.category)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">제목</label>
          <input
            name="title"
            required
            defaultValue={note.title}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">내용</label>
          <textarea
            name="content"
            required
            rows={4}
            defaultValue={note.content}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">태그 (콤마로 구분)</label>
          <input
            name="tags"
            defaultValue={note.tags ?? ""}
            placeholder="예) 실손보험, 세법개정"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>

        <div className="border-t border-slate-100 pt-3">
          <label className="block text-xs text-slate-500 mb-1">파일 추가</label>
          <FileAttachDropzone />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          저장
        </button>
      </form>

      {note.attachments.length > 0 && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">첨부된 파일</p>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((a) => (
                <div key={a.id} className="group relative">
                  <a href={a.filePath!} target="_blank" rel="noreferrer">
                    <img
                      src={a.filePath!}
                      alt={a.originalName}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  </a>
                  <form action={deleteNoteAttachment.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-400 shadow hover:text-red-600 group-hover:flex"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {audios.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <audio controls src={a.filePath!} className="h-9 max-w-full" />
              <form action={deleteNoteAttachment.bind(null, a.id)}>
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  삭제
                </button>
              </form>
            </div>
          ))}

          {transcripts.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">📝 대본</span>
                <form action={deleteNoteAttachment.bind(null, a.id)}>
                  <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                    삭제
                  </button>
                </form>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}

          {files.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <a
                href={a.filePath!}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                📎 {a.originalName}
              </a>
              <form action={deleteNoteAttachment.bind(null, a.id)}>
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  삭제
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
