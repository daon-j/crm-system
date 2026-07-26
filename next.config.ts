import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 학습노트 녹음파일 첨부(용량이 큰 오디오 파일)를 위해 기본 1MB 제한을 상향
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
