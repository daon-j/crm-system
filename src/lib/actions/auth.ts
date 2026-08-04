"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirectWithFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { requireUser, verifyPassword, hashPassword, createSession, destroySession } from "@/lib/auth";

export async function signup(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");
  const inviteCode = formData.get("inviteCode");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof inviteCode !== "string" ||
    !email ||
    !password ||
    !inviteCode
  ) {
    return { error: "필수 항목을 모두 입력해주세요" };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다" };
  }
  if (inviteCode !== process.env.SIGNUP_INVITE_CODE) {
    return { error: "초대코드가 올바르지 않습니다" };
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return { error: "이미 가입된 이메일입니다" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.trim(),
      passwordHash,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요" };
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  await createSession(user.id, formData.get("remember") === "on");
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const birthDateStr = str(formData, "birthDate");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: str(formData, "name"),
      phone: str(formData, "phone"),
      extension: str(formData, "extension"),
      birthDate: birthDateStr ? new Date(birthDateStr) : null,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/");
  redirectWithFlash("/settings", "프로필이 저장되었습니다");
}

export async function changePassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await requireUser();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    return { error: "현재 비밀번호와 새 비밀번호를 입력해주세요" };
  }
  if (newPassword.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다" };
  }

  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(currentPassword, fullUser.passwordHash))) {
    return { error: "현재 비밀번호가 올바르지 않습니다" };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: true };
}
