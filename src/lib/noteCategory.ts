// 기존 3개 고정 코드 -> 사람이 읽기 좋은 이름 (과거 데이터 호환용)
const KNOWN_LABEL: Record<string, string> = {
  MORNING_MEETING: "정보미팅",
  MORNING_TRAINING: "오전교육",
  ETC: "기타",
};

const KNOWN_STYLE: Record<string, string> = {
  MORNING_MEETING: "bg-blue-100 text-blue-700",
  정보미팅: "bg-blue-100 text-blue-700",
  MORNING_TRAINING: "bg-emerald-100 text-emerald-700",
  오전교육: "bg-emerald-100 text-emerald-700",
  ETC: "bg-slate-100 text-slate-600",
  기타: "bg-slate-100 text-slate-600",
};

const HASH_PALETTE = [
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
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
