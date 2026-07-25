"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createTodo(formData: FormData) {
  const content = str(formData, "content");
  if (!content) throw new Error("할일 내용은 필수입니다");
  const priority = str(formData, "priority") ?? "MEDIUM";
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    throw new Error("중요도는 HIGH/MEDIUM/LOW 중 하나여야 합니다");
  }

  await prisma.todo.create({ data: { content, priority } });
  revalidatePath("/");
}

export async function toggleTodo(todoId: string, formData: FormData) {
  const done = formData.get("done") === "true";
  await prisma.todo.update({ where: { id: todoId }, data: { done: !done } });
  revalidatePath("/");
}

export async function deleteTodo(todoId: string) {
  await prisma.todo.delete({ where: { id: todoId } });
  revalidatePath("/");
}
