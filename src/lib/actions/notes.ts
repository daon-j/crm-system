"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createStudyNote(formData: FormData) {
  const title = str(formData, "title");
  const content = str(formData, "content");
  const dateStr = str(formData, "date");
  if (!title || !content || !dateStr) throw new Error("날짜, 제목, 내용은 필수입니다");

  await prisma.studyNote.create({
    data: {
      date: new Date(dateStr),
      category: str(formData, "category") ?? "ETC",
      title,
      content,
      tags: str(formData, "tags"),
    },
  });

  revalidatePath("/notes");
}

export async function deleteStudyNote(noteId: string) {
  await prisma.studyNote.delete({ where: { id: noteId } });
  revalidatePath("/notes");
}
