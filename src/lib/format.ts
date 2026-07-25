export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isSameMonthDay(date: Date | string, ref: Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

// 주민등록번호 뒷자리를 가려서 표시 (예: 901231-1234567 -> 901231-1●●●●●●)
export function maskResidentNumber(value: string | null | undefined): string {
  if (!value) return "-";
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 7) return value;
  return `${digits.slice(0, 6)}-${digits.slice(6, 7)}${"●".repeat(Math.max(digits.length - 7, 6))}`;
}

// 전화번호를 하이픈 포함 형식으로 통일해서 표시 (입력 시 하이픈 유무와 무관하게 항상 동일하게 노출)
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "-";
  const digits = value.replace(/[^0-9]/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return value;
}

export const GRADE_LABEL: Record<string, string> = {
  A: "A등급 (월 1회)",
  B: "B등급 (분기 1회)",
  C: "C등급 (반기 1회)",
};
