// 기존 3개 고정 코드 -> 사람이 읽기 좋은 이름 (과거 데이터 호환용)
const KNOWN_LABEL: Record<string, string> = {
  MORNING_MEETING: "정보미팅",
  MORNING_TRAINING: "오전교육",
  ETC: "기타",
};

const KNOWN_STYLE: Record<string, string> = {
  MORNING_MEETING: "bg-info-soft text-info",
  정보미팅: "bg-info-soft text-info",
  MORNING_TRAINING: "bg-success-soft text-success",
  오전교육: "bg-success-soft text-success",
  ETC: "bg-surface-muted text-ink-2",
  기타: "bg-surface-muted text-ink-2",
};

const HASH_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-accent-soft text-accent",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
];

export function categoryLabel(category: string): string {
  return KNOWN_LABEL[category] ?? category;
}

export function categoryStyle(category: string): string {
  if (KNOWN_STYLE[category]) return KNOWN_STYLE[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return HASH_PALETTE[hash % HASH_PALETTE.length];
}
