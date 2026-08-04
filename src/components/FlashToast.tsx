"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/lib/toast";

export default function FlashToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const flash = searchParams.get("flash");

  useEffect(() => {
    if (!flash) return;
    showToast(`✅ ${flash}`);

    const params = new URLSearchParams(searchParams);
    params.delete("flash");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  return null;
}
