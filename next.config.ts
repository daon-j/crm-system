import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 와이파이의 폰 등에서 로컬 네트워크 IP나 Cloudflare 임시 터널로 접속해 테스트할 때 HMR 차단 경고를 없앰
  allowedDevOrigins: ["172.30.1.37", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      // 학습노트 녹음파일 첨부(용량이 큰 오디오 파일)를 위해 기본 1MB 제한을 상향
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
