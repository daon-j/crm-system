"use client";

import { useState } from "react";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: "text";
          text: string;
          link: { mobileWebUrl: string; webUrl: string };
        }) => void;
      };
    };
  }
}

const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
const SDK_ELEMENT_ID = "kakao-sdk-script";

let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (window.Kakao) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(SDK_ELEMENT_ID) as HTMLScriptElement | null;
      const script = existing ?? document.createElement("script");
      script.id = SDK_ELEMENT_ID;
      script.src = SDK_URL;
      script.async = true;
      script.addEventListener("load", () => resolve());
      script.addEventListener("error", () => reject(new Error("카카오 SDK 로드 실패")));
      if (!existing) document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function KakaoShareButton({
  content,
  appKey,
}: {
  content: string;
  appKey?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  if (!appKey) {
    return (
      <span
        title="카카오 공유 기능을 쓰려면 NEXT_PUBLIC_KAKAO_JS_KEY 환경변수를 설정하세요 (카카오 디벨로퍼스에서 무료 발급)"
        className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-400"
      >
        💬 카톡 공유 (설정 필요)
      </span>
    );
  }

  async function handleClick() {
    setStatus("loading");
    try {
      await loadKakaoSdk();
      if (!window.Kakao!.isInitialized()) {
        window.Kakao!.init(appKey!);
      }
      window.Kakao!.Share.sendDefault({
        objectType: "text",
        text: content,
        link: {
          mobileWebUrl: window.location.origin,
          webUrl: window.location.origin,
        },
      });
      setStatus("idle");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className="rounded-lg border border-yellow-300 bg-yellow-50 px-3.5 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
    >
      {status === "loading" ? "불러오는 중..." : status === "error" ? "💬 카톡 공유 (실패, 재시도)" : "💬 카톡 공유"}
    </button>
  );
}
