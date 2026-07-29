export type DayItem = {
  key: string;
  label: string;
  type: "ROUTINE" | "VISIT" | "TRAINING" | "CUSTOM" | "BIRTHDAY" | "EXPIRY";
  href?: string;
  eventId?: string;
  // ROUTINE(정보미팅/오전교육) 전용 - 참석 여부 및 토글에 필요한 정보
  attended?: boolean;
  routineDate?: string;
  routineType?: "MEETING" | "TRAINING";
};

export const TYPE_STYLE: Record<DayItem["type"], string> = {
  ROUTINE: "bg-surface-muted text-ink-muted",
  VISIT: "bg-info-soft text-info",
  TRAINING: "bg-success-soft text-success",
  CUSTOM: "bg-primary/10 text-primary",
  BIRTHDAY: "bg-accent-soft text-accent",
  EXPIRY: "bg-danger-soft text-danger",
};

export const TYPE_DOT: Record<DayItem["type"], string> = {
  ROUTINE: "bg-border",
  VISIT: "bg-info",
  TRAINING: "bg-success",
  CUSTOM: "bg-primary",
  BIRTHDAY: "bg-accent",
  EXPIRY: "bg-danger",
};

export const TYPE_TEXT: Record<DayItem["type"], string> = {
  ROUTINE: "text-ink-muted",
  VISIT: "text-info",
  TRAINING: "text-success",
  CUSTOM: "text-primary",
  BIRTHDAY: "text-accent",
  EXPIRY: "text-danger",
};

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
