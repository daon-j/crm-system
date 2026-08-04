import { redirect } from "next/navigation";

export function withFlash(path: string, message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}flash=${encodeURIComponent(message)}`;
}

// 외부에서 넘어온 경로가 우리 앱 내부 상대경로인지 확인한다 (오픈 리다이렉트 방지).
export function isSafeInternalPath(path: string | undefined | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

// 저장/등록/변경 등 액션 후 적절한 화면으로 이동하면서 완료 메시지를 함께 전달한다.
export function redirectWithFlash(path: string, message: string): never {
  redirect(withFlash(path, message));
}
