import { prisma } from "@/lib/prisma";

export const DASHBOARD_SECTIONS = [
  { key: "todayVisits", label: "오늘의 방문" },
  { key: "quickActions", label: "빠른가기" },
  { key: "todos", label: "오늘 할일" },
  { key: "upcomingVisits", label: "다가오는 방문예약" },
  { key: "miniCalendar", label: "일정 (지난주·이번주·다음주)" },
  { key: "statCards", label: "통계 카드 (총고객수·모바일동의 등)" },
  { key: "threeColumnGrid", label: "오늘콜대상 · 발송대기문자 · 오늘생일" },
  { key: "bottomStats", label: "통계 (등급별 · 보험종류별 등)" },
] as const;

export type DashboardSectionKey = (typeof DASHBOARD_SECTIONS)[number]["key"];

const DEFAULT_ORDER: DashboardSectionKey[] = DASHBOARD_SECTIONS.map((s) => s.key);
const SETTING_KEY = "dashboard_layout";

export type DashboardLayout = {
  order: DashboardSectionKey[];
  hidden: DashboardSectionKey[];
};

function isValidKey(k: string): k is DashboardSectionKey {
  return (DEFAULT_ORDER as string[]).includes(k);
}

export async function getDashboardLayout(): Promise<DashboardLayout> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return { order: DEFAULT_ORDER, hidden: [] };

  try {
    const parsed = JSON.parse(row.value) as { order?: string[]; hidden?: string[] };
    const order = (parsed.order ?? []).filter(isValidKey);
    // 나중에 새로 추가된 섹션이 저장된 순서에 없으면 기본 순서상의 위치에 끼워넣는다
    for (let i = 0; i < DEFAULT_ORDER.length; i++) {
      const key = DEFAULT_ORDER[i];
      if (!order.includes(key)) order.splice(Math.min(i, order.length), 0, key);
    }
    const hidden = (parsed.hidden ?? []).filter(isValidKey);
    return { order, hidden };
  } catch {
    return { order: DEFAULT_ORDER, hidden: [] };
  }
}

export async function saveDashboardLayout(layout: DashboardLayout): Promise<void> {
  const value = JSON.stringify(layout);
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value },
  });
}
