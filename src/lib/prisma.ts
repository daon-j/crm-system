import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Vercel처럼 서버리스 환경에서는 함수 인스턴스마다 커넥션 풀이 따로 열려서,
  // 풀 하나당 여러 커넥션(pg 기본값 10개)을 잡으면 클라우드 DB 쪽 동시 연결 한도를
  // 순식간에 채워 "가끔 저장 실패" 같은 간헐적 오류가 난다. 인스턴스당 1개로 제한하고
  // DB 앞단의 커넥션 풀러(pooled.db.prisma.io)가 실제 팬아웃을 담당하도록 한다.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
