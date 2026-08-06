import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Vercel처럼 서버리스 환경에서는 함수 인스턴스마다 커넥션 풀이 따로 열리므로,
  // pg 기본값(10개)까지는 열지 않고 인스턴스당 소수로 제한한다. 다만 대시보드 하나가
  // Promise.all로 10개 넘는 쿼리를 동시에 날리기 때문에, 너무 낮게 잡으면(예: 5) 그 쿼리들이
  // 커넥션 몇 개를 두고 줄서서 처리되며 오히려 느려진다. DB 앞단의 커넥션 풀러
  // (pooled.db.prisma.io)가 실제 팬아웃을 담당한다는 전제 하에 여유 있게 둔다.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 15 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
