"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { syncStudyNoteToNotion } from "@/lib/notion";
import { saveNoteAttachmentsFromFiles } from "@/lib/noteAttachments";
import { requireUser } from "@/lib/auth";
import { rm } from "fs/promises";
import path from "path";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createStudyNote(formData: FormData) {
  const user = await requireUser();

  const title = str(formData, "title");
  const content = str(formData, "content");
  const dateStr = str(formData, "date");
  if (!title || !content || !dateStr) throw new Error("날짜, 제목, 내용은 필수입니다");

  const note = await prisma.studyNote.create({
    data: {
      userId: user.id,
      date: new Date(dateStr),
      category: str(formData, "category") ?? "정보미팅",
      title,
      content,
      tags: str(formData, "tags"),
    },
  });

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const attachments = await saveNoteAttachmentsFromFiles(note.id, files);
  await syncStudyNoteToNotion(note, attachments);

  revalidatePath("/notes");
  redirectWithFlash("/notes", "노트가 저장되었습니다");
}

export async function updateStudyNote(noteId: string, formData: FormData) {
  const user = await requireUser();

  const title = str(formData, "title");
  const content = str(formData, "content");
  const dateStr = str(formData, "date");
  if (!title || !content || !dateStr) throw new Error("날짜, 제목, 내용은 필수입니다");

  await prisma.studyNote.update({
    where: { id: noteId, userId: user.id },
    data: {
      date: new Date(dateStr),
      category: str(formData, "category") ?? "정보미팅",
      title,
      content,
      tags: str(formData, "tags"),
    },
  });

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  await saveNoteAttachmentsFromFiles(noteId, files);

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}/edit`);
  redirectWithFlash("/notes", "노트가 수정되었습니다");
}

export async function deleteStudyNote(noteId: string) {
  const user = await requireUser();
  await prisma.studyNote.delete({ where: { id: noteId, userId: user.id } });
  await rm(path.join(process.cwd(), "public", "uploads", "notes", noteId), { recursive: true, force: true });
  revalidatePath("/notes");
}

export async function deleteNoteAttachment(attachmentId: string) {
  const user = await requireUser();
  const attachment = await prisma.noteAttachment.findFirst({
    where: { id: attachmentId, studyNote: { userId: user.id } },
  });
  if (!attachment) return;

  await prisma.noteAttachment.delete({ where: { id: attachmentId } });
  if (attachment.filePath) {
    await rm(path.join(process.cwd(), "public", attachment.filePath), { force: true });
  }
  revalidatePath("/notes");
  revalidatePath(`/notes/${attachment.studyNoteId}/edit`);
}
