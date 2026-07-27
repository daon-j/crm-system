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
