"use server";

import { revalidatePath } from "next/cache";
import { getDashboardLayout, saveDashboardLayout, type DashboardSectionKey } from "@/lib/dashboardLayout";

export async function moveDashboardSection(key: DashboardSectionKey, direction: "up" | "down") {
  const layout = await getDashboardLayout();
  const idx = layout.order.indexOf(key);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= layout.order.length) return;

  const order = [...layout.order];
  [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];

  await saveDashboardLayout({ ...layout, order });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function toggleDashboardSection(key: DashboardSectionKey) {
  const layout = await getDashboardLayout();
  const hidden = layout.hidden.includes(key)
    ? layout.hidden.filter((h) => h !== key)
    : [...layout.hidden, key];

  await saveDashboardLayout({ ...layout, hidden });
  revalidatePath("/");
  revalidatePath("/settings");
}
