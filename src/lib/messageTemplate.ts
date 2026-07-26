// {{변수명}} 형태의 플레이스홀더를 실제 값으로 치환. 값이 없는 변수는 그대로 남겨둠.
export function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] ?? `{{${key.trim()}}}`);
}
