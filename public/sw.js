// 최소 서비스워커 - PWA 설치 조건을 만족시키기 위한 용도.
// 오프라인 캐싱은 하지 않고 네트워크 요청을 그대로 통과시킨다.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
