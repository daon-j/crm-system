// {{변수명}} 형태의 플레이스홀더를 실제 값으로 치환. 값이 없는 변수는 그대로 남겨둠.
export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] ?? `{{${key.trim()}}}`);
}

// 문자 템플릿의 {{설계사명}}/{{설계사전화번호}}/{{설계사내선번호}}에 채울 로그인 사용자 정보
export function agentVars(user: { name: string | null; phone: string | null; extension: string | null }) {
  return {
    설계사명: user.name ?? "담당 설계사",
    설계사전화번호: user.phone ?? "",
    설계사내선번호: user.extension ?? "",
  };
}

// 템플릿 목록 화면에서 카테고리를 이 순서로 묶어서 보여줌 (여기 없는 카테고리는 뒤에 등장 순서대로)
export const TEMPLATE_CATEGORY_ORDER = [
  "방문확정",
  "부재중(당일)",
  "부재중(2차+)",
  "미팅후",
  "일정조율",
  "생일",
  "월간안부",
  "만기알림",
  "담당배정",
  "통화감사",
  "지인관리",
];

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ia = TEMPLATE_CATEGORY_ORDER.indexOf(a);
    const ib = TEMPLATE_CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// 항상 조용히(폼에 별도 입력칸 없이) 채워지는 변수 - 로그인 사용자/고객 선택만으로 채워짐
export const AUTO_SILENT_KEYS = ["고객명", "설계사명", "설계사전화번호", "설계사내선번호"];

// 계약상품 선택으로 채워지는 변수
export const CONTRACT_KEYS = ["상품명", "만기일"];

// 방문 일정으로 채워지는 변수
export const VISIT_KEYS = ["방문날짜", "방문시간", "방문장소"];

// 사용자가 상황에 맞게 직접 입력하는 변수의 라벨/입력 힌트
export const MANUAL_FIELD_META: Record<string, { label: string; placeholder: string }> = {
  연락시점: { label: "연락시점", placeholder: "예) 오늘 오전에" },
  이전연락시점: { label: "이전연락시점", placeholder: "예) 지난주 화요일에" },
  통화예정일시: { label: "통화예정일시", placeholder: "예) 8월 3일 오후 3시" },
  다음연락예정일: { label: "다음연락예정일", placeholder: "예) 8월 5일" },
  가족구성원: { label: "가족구성원 (선택)", placeholder: "예) 배우자분" },
  계절인사: { label: "계절인사 (선택)", placeholder: "예) 요즘 날씨가 많이 더운데" },
};

// 템플릿 문구 안의 {{변수}} 토큰을 첫 등장 순서대로 중복없이 추출
export function extractTemplateVars(body: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const re = /{{(.*?)}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const key = m[1].trim();
    if (!seen.has(key)) {
      seen.add(key);
      found.push(key);
    }
  }
  return found;
}

// SMS 원문은 한 줄 길이를 맞추려고 문장 중간에도 줄바꿈이 많이 들어가 있어서(옛 SMS 90byte 관행),
// 목록/카드 미리보기에서 그대로 보여주면 문장이 뚝뚝 끊겨 보인다. 문단(빈 줄) 구분과
// 서명/괄호 placeholder 같은 독립 줄은 유지하되, 문장 중간의 줄바꿈만 공백으로 이어붙여 자연스럽게 흘러가도록 만든다.
// 실제 발송되는 문구(작성 화면의 "문구" textarea)에는 적용하지 않음 - 그쪽은 원문 그대로 유지.
function normalizeForDisplay(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph.split("\n");
      const out: string[] = [];
      let buffer: string[] = [];
      const flush = () => {
        if (buffer.length > 0) {
          out.push(buffer.join(" "));
          buffer = [];
        }
      };
      for (const rawLine of lines) {
        const line = rawLine.trim();
        const isLabelLine = /^[^\s:：][^:：]{0,11}[:：]/.test(line);
        const isStandalone =
          line === "" || isLabelLine || /^\[.*\]$/.test(line) || /^\(.*\)$/.test(line) || /^[\d][\d\-\s]{5,}$/.test(line);
        if (isStandalone) {
          flush();
          if (line) out.push(line);
        } else {
          buffer.push(line);
        }
      }
      flush();
      return out.join("\n");
    })
    .join("\n\n");
}

// 문자함/템플릿 둘러보기 목록에서 {{변수}} 원문 대신 실제 발송되는 것처럼 예시로 채운 문구를 보여주기 위한 함수.
// 자동으로 아는 값(로그인 사용자 정보, 선택된 고객명)은 실제 값으로, 나머지는 괄호 라벨로 채운다.
export function previewFill(
  body: string,
  agent: { 설계사명: string; 설계사전화번호: string; 설계사내선번호: string },
  customerName: string = "홍길동",
): string {
  const filled = body.replace(/{{(.*?)}}/g, (_, rawKey) => {
    const key = rawKey.trim();
    if (key === "고객명") return customerName;
    if (key === "설계사명") return agent.설계사명;
    if (key === "설계사전화번호") return agent.설계사전화번호 || "(전화번호)";
    if (key === "설계사내선번호") return agent.설계사내선번호 || "(내선번호)";
    const meta = MANUAL_FIELD_META[key];
    return `(${meta?.label.replace(" (선택)", "") ?? key})`;
  });
  return normalizeForDisplay(filled);
}
