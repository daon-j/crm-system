import { redirect } from "next/navigation";

export function withFlash(path: string, message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}flash=${encodeURIComponent(message)}`;
}

// 저장/등록/변경 등 액션 후 적절한 화면으로 이동하면서 완료 메시지를 함께 전달한다.
export function redirectWithFlash(path: string, message: string): never {
  redirect(withFlash(path, message));
}
