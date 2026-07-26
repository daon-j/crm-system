export type ToastDetail = { id: string; message: string };

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>("crm-toast", {
      detail: { id: crypto.randomUUID(), message },
    }),
  );
}
