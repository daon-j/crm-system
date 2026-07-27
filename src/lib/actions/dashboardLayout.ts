"use server";

import { revalidatePath } from "next/cache";
import { getDashboardLayout, saveDashboardLayout, type DashboardSectionKey } from "@/lib/dashboardLayout";
import { requireUser } from "@/lib/auth";

export async function moveDashboardSection(key: DashboardSectionKey, direction: "up" | "down") {
  const user = await requireUser();
  const layout = await getDashboardLayout(user.id);
  const idx = layout.order.indexOf(key);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= layout.order.length) return;

  const order = [...layout.order];
  [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];

  await saveDashboardLayout({ ...layout, order }, user.id);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function toggleDashboardSection(key: DashboardSectionKey) {
  const user = await requireUser();
  const layout = await getDashboardLayout(user.id);
  const hidden = layout.hidden.includes(key)
    ? layout.hidden.filter((h) => h !== key)
    : [...layout.hidden, key];

  await saveDashboardLayout({ ...layout, hidden }, user.id);
  revalidatePath("/");
  revalidatePath("/settings");
}
