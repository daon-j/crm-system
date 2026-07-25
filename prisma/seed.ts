import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const missedCallTemplate = await prisma.messageTemplate.upsert({
    where: { id: "tpl-missed-call" },
    update: {},
    create: {
      id: "tpl-missed-call",
      name: "부재중 안내",
      category: "부재중",
      body: "{{고객명}}님, 연락드렸는데 통화가 어려우셨네요. 편하실 때 회신 부탁드립니다. - {{설계사명}}",
    },
  });

  const visitConfirmTemplate = await prisma.messageTemplate.upsert({
    where: { id: "tpl-visit-confirm" },
    update: {},
    create: {
      id: "tpl-visit-confirm",
      name: "방문예약 확정",
      category: "방문확정",
      body: "{{고객명}}님, 방문 일정이 {{방문일시}}로 확정되었습니다. 그때 뵙겠습니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-birthday" },
    update: {},
    create: {
      id: "tpl-birthday",
      name: "생일 축하",
      category: "생일",
      body: "{{고객명}}님, 생일 진심으로 축하드립니다! 항상 건강하시길 바랍니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-monthly" },
    update: {},
    create: {
      id: "tpl-monthly",
      name: "월간 안부 + 자동차쿠폰",
      category: "월간안부",
      body: "{{고객명}}님, 안녕하세요. 이번 달 안부 인사드립니다. 자동차 쿠폰도 함께 보내드려요! - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-expiry" },
    update: {},
    create: {
      id: "tpl-expiry",
      name: "만기 30일 전 안내",
      category: "만기알림",
      body: "{{고객명}}님, 가입하신 {{상품명}}이 {{만기일}}에 만기됩니다. 상담이 필요하시면 편히 연락 주세요. - {{설계사명}}",
    },
  });

  const defaultResultTypes: {
    id: string;
    name: string;
    messageTemplateId?: string;
    createsCalendarEvent?: boolean;
  }[] = [
    { id: "crt-missed", name: "부재중", messageTemplateId: missedCallTemplate.id },
    {
      id: "crt-visit-confirmed",
      name: "방문확정",
      messageTemplateId: visitConfirmTemplate.id,
      createsCalendarEvent: true,
    },
    { id: "crt-hold", name: "보류" },
    { id: "crt-rejected", name: "거절" },
    { id: "crt-joined", name: "가입완료" },
  ];

  for (const rt of defaultResultTypes) {
    await prisma.callResultType.upsert({
      where: { id: rt.id },
      update: {},
      create: {
        id: rt.id,
        name: rt.name,
        isDefault: true,
        messageTemplateId: rt.messageTemplateId,
        createsCalendarEvent: rt.createsCalendarEvent ?? false,
      },
    });
  }

  console.log("시드 데이터 생성 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
