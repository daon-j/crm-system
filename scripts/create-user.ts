import "dotenv/config";
import { createInterface } from "readline/promises";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await rl.question("이메일: ")).trim();
  const name = (await rl.question("이름 (선택, 그냥 엔터 가능): ")).trim();
  const password = await rl.question("비밀번호: ");
  rl.close();

  if (!email || !password) {
    console.error("이메일과 비밀번호는 필수입니다.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error("이미 존재하는 이메일입니다.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null },
  });

  console.log(`계정 생성 완료: ${user.email} (id: ${user.id})`);
  await prisma.$disconnect();
}

main();
