import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/format";
import { updateStudyNote, deleteNoteAttachment } from "@/lib/actions/notes";
import { categoryLabel } from "@/lib/noteCategory";
import FileAttachDropzone from "@/components/FileAttachDropzone";
import CategoryChips from "@/components/CategoryChips";
import { requireUser } from "@/lib/auth";

export default async function EditStudyNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [note, distinctCategories] = await Promise.all([
    prisma.studyNote.findFirst({
      where: { id, userId: user.id },
      include: { attachments: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.studyNote.findMany({
      where: { userId: user.id },
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
        <h1 className="text-2xl font-bold text-ink">노트 수정</h1>
        <Link href="/notes" className="text-sm text-ink-muted hover:underline">
          ← 목록으로
        </Link>
      </div>

      <form
        action={boundUpdate}
        className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <div>
          <label className="block text-xs text-ink-muted mb-1">날짜</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={toDateInputValue(note.date)}
            className="w-40 rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">구분</label>
          <CategoryChips name="category" options={categoryLabels} defaultValue={categoryLabel(note.category)} />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">제목</label>
          <input
            name="title"
            required
            defaultValue={note.title}
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">내용</label>
          <textarea
            name="content"
            required
            rows={4}
            defaultValue={note.content}
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">태그 (콤마로 구분)</label>
          <input
            name="tags"
            defaultValue={note.tags ?? ""}
            placeholder="예) 실손보험, 세법개정"
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
        </div>

        <div className="border-t border-border pt-3">
          <label className="block text-xs text-ink-muted mb-1">파일 추가</label>
          <FileAttachDropzone />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          저장
        </button>
      </form>

      {note.attachments.length > 0 && (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-xs font-medium text-ink-muted">첨부된 파일</p>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((a) => (
                <div key={a.id} className="group relative">
                  <a href={a.filePath!} target="_blank" rel="noreferrer">
                    <img
                      src={a.filePath!}
                      alt={a.originalName}
                      className="h-20 w-20 rounded-lg border border-border object-cover bg-surface-muted"
                    />
                  </a>
                  <form action={deleteNoteAttachment.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-xs text-ink-muted shadow hover:text-danger lg:hidden lg:group-hover:flex"
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
                <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                  삭제
                </button>
              </form>
            </div>
          ))}

          {transcripts.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-muted">📝 대본</span>
                <form action={deleteNoteAttachment.bind(null, a.id)}>
                  <button type="submit" className="text-xs text-ink-muted hover:text-danger">
                    삭제
                  </button>
                </form>
              </div>
              <p className="text-sm text-ink-2 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}

          {files.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <a
                href={a.filePath!}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                📎 {a.originalName}
              </a>
              <form action={deleteNoteAttachment.bind(null, a.id)}>
                <button type="submit" className="text-xs text-ink-muted hover:text-danger">
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
