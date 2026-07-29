import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const missedCallTemplate = await prisma.messageTemplate.upsert({
    where: { id: "tpl-missed-call" },
    update: { category: "부재중(당일)" },
    create: {
      id: "tpl-missed-call",
      name: "부재중 안내",
      category: "부재중(당일)",
      body: "{{고객명}}님, 연락드렸는데 통화가 어려우셨네요. 편하실 때 회신 부탁드립니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-missed-call-1" },
    update: { category: "부재중(2차+)" },
    create: {
      id: "tpl-missed-call-1",
      name: "부재중 안내 (1차)",
      category: "부재중(2차+)",
      body: "{{고객명}}님, 안내 말씀드리려 연락드렸는데 통화가 어려우셨네요. 편하실 때 회신 부탁드립니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-missed-call-2" },
    update: { category: "부재중(2차+)" },
    create: {
      id: "tpl-missed-call-2",
      name: "부재중 안내 (2차)",
      category: "부재중(2차+)",
      body: "{{고객명}}님, 다시 한번 연락드렸는데도 통화가 어려우셨네요. 편하신 시간에 회신 주시면 감사하겠습니다. - {{설계사명}}",
    },
  });

  const visitConfirmTemplate = await prisma.messageTemplate.upsert({
    where: { id: "tpl-visit-confirm" },
    update: { category: "방문확정" },
    create: {
      id: "tpl-visit-confirm",
      name: "방문예약 확정",
      category: "방문확정",
      body: "{{고객명}}님, 방문 일정이 {{방문일시}}로 확정되었습니다. 그때 뵙겠습니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-birthday" },
    update: { category: "생일" },
    create: {
      id: "tpl-birthday",
      name: "생일 축하",
      category: "생일",
      body: "{{고객명}}님, 생일 진심으로 축하드립니다! 항상 건강하시길 바랍니다. - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-monthly" },
    update: { category: "월간안부" },
    create: {
      id: "tpl-monthly",
      name: "월간 안부 + 자동차쿠폰",
      category: "월간안부",
      body: "{{고객명}}님, 안녕하세요. 이번 달 안부 인사드립니다. 자동차 쿠폰도 함께 보내드려요! - {{설계사명}}",
    },
  });

  await prisma.messageTemplate.upsert({
    where: { id: "tpl-expiry" },
    update: { category: "만기알림" },
    create: {
      id: "tpl-expiry",
      name: "만기 30일 전 안내",
      category: "만기알림",
      body: "{{고객명}}님, 가입하신 {{상품명}}이 {{만기일}}에 만기됩니다. 상담이 필요하시면 편히 연락 주세요. - {{설계사명}}",
    },
  });

  // DB손해보험 보상청구서비스 문자 템플릿 10건 (기존 변수 체계에 맞춰 {변수}->{{변수}} 전환)
  const dbTemplates: { id: string; name: string; category: string; body: string }[] = [
    {
      id: "tpl-db-1",
      name: "① 담당자 최초 배정 안내",
      category: "담당배정",
      body: `안녕하세요.
{{고객명}} 고객님^-^
보유하신 {{상품명}} 보상창구서비스 담당을 맡게된 DB손해보험 {{설계사명}}TCR입니다.

원활한 보상청구와 계약관리를 위해
고객정보 확인차 고객님께연락드릴 예정입니다.
통화 가능시간대를 회신 해주시는 분들은 남겨주신 시간대에 연락드리고 시간대를 지정하지 않으신 분들은 순차적으로 연락드리겠습니다.
앞으로 보험을 유지하시는동안 불편함 없도록 도움드릴수있는 담당자가 되도록 하겠습니다^^
[DB손해보험 보상청구서비스담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-2",
      name: "② 통화 후(당일) 감사 인사 및 안내",
      category: "통화감사",
      body: `안녕하세요.
{{고객명}} 고객님^-^
{{연락시점}} 연락드렸던 DB손해보험 보상청구서비스 담당자 {{설계사명}} TCR입니다.
{{연락시점}} 바쁘신 와중에도 통화해 주셔서 감사합니다.
보험금 청구, 계약 관련 문의, 주소·연락처 변경 등 도움이 필요하시면 언제든 편하게 연락 부탁드립니다.
앞으로 고객님께서 보험을 유지하시는 동안 불편함이 없도록 도움드릴 수 있는 담당자가 되겠습니다.^^
좋은 하루 되세요.
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-3",
      name: "③ 지인관리 고객 대응 (보장 비교 안내 제안형)",
      category: "지인관리",
      body: `안녕하세요.
{{고객명}} 고객님^-^
{{연락시점}} 통화드렸던 DB손해보험 보상청구서비스 담당자 {{설계사명}} TCR입니다.
고객님 말씀처럼 현재 지인분을 통해 보험 관리를 잘 받고 계시다고 하니 다행입니다.^^
아는 분을 통해 보험 서비스를 받아보신 경험이 있으시다면 제가 드리는 안내도 더욱 이해하시기 쉬울 것이라 생각됩니다. 또한 현재 받고 계신 서비스와 비교해 보실 수 있는 기회가 될 수도 있으니 부담 없이 참고해 주시면 감사하겠습니다.
제가 말씀드리고 싶은 부분은 상품 가입 권유에 대한 부분이 절대 아니고, 고객님께서 가입하신 보험 상품의 보장내용과 담보를 자세히 안내해 드리고 보험 관련 궁금하신 사항을 도와드리기 위해서입니다.
보험은 한 분의 의견만 듣기보다는 여러 담당자의 의견을 들어보시는 것도 도움이 될 수 있습니다. 혹시 보험금 청구와 관련하여 놓치신 부분이 있거나 궁금하신 점이 있으시면 언제든 편하게 연락 주세요.
DB손해보험 담당자로서 성실히 안내해 드리겠습니다.
좋은 하루 되세요.
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-4",
      name: "④ 지인관리 고객 재연락 안내 (간단형)",
      category: "지인관리",
      body: `안녕하세요.
{{고객명}} 고객님^-^
DB손해보험 보상서비스 담당자 {{설계사명}}입니다.
{{이전연락시점}}에 연락한번 드렸었는데요.
지인분께서 보험관리를 잘 해주시고 계시다니 너무 다행입니다.
제가 보유하신 {{상품명}}의 담당자로 배정되어서
다시 한번 연락드린거구요.
지인분께 보험관리 받는 과정 안에서 혹시라도
궁금하신 사항이 있으시면 편하게 연락부탁드립니다.^^
앞으로 보험을 유지하시는 동안 불편함이 없도록
도움드릴 수 있는 담당자가 되도록 하겠습니다.
오늘도 좋은하루 되세요^-^
감사합니다.
[DB 보상청구서비스담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-5",
      name: "⑤ 방문 예약 확정",
      category: "방문확정",
      body: `안녕하세요
{{고객명}} 고객님^^
DB손해보험 보상서비스
담당자 {{설계사명}}입니다.
방문날짜 : {{방문날짜}}
약속시간 : {{방문시간}}
장소 : {{방문장소}}
"예약확정"🍀
변동사항 시 연락주시면 감사하겠습니다
오늘하루 행복하세요~~^^*`,
    },
    {
      id: "tpl-db-6",
      name: "⑥ 오전콜 부재시 안내 (상세형)",
      category: "부재중(당일)",
      body: `안녕하세요.
{{고객명}} 고객님^-^
DB손해보험 보상청구서비스 담당자 {{설계사명}}입니다.
{{계절인사}} 잘 지내고 계신가요?
오전에 연락드렸는데 통화가 어려우셔서 문자 남겨드립니다.^^
고객님 담당자로 인사드리고 보험 유지와 관련하여 안내드릴 내용이 있어 연락드렸습니다.
통화 가능하신 시간대를 회신주시면 시간 맞춰 연락드리겠습니다.
혹시 보험금 청구나 계약 관련 문의사항이 있으시면 문자나 전화로 편하게 연락주시기 바랍니다.^^
오늘도 행복한 하루되세요~
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-7",
      name: "⑦ 2차 이상 부재시 안내 (기본형)",
      category: "부재중(2차+)",
      body: `안녕하세요.
{{고객명}} 고객님^^
DB손해보험 보상서비스 담당자 {{설계사명}}입니다.
잘 지내고 계신가요?^^
고객님께 중요안내사항이 있어
몇 차례 연락드렸는데
통화가 안되서 문자 남겨드립니다.
통화 가능하신 시간대를 회신 주시면
제가 전화드리도록 하겠습니다.
보험금 청구, 계약 관련 문의, 보장내용 확인 등
궁금하신 사항이 있으시면
언제든지 연락주시기 바랍니다.
{{계절인사}}
오늘도 좋은 하루 보내세요.^-^
감사합니다.
[DB 보상청구서비스담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-8",
      name: "⑧ 2차 이상 부재시 안내 (이전 문자 언급형)",
      category: "부재중(2차+)",
      body: `안녕하세요.
{{고객명}} 고객님^^
DB손해보험 보상청구서비스 담당자 {{설계사명}}입니다.
지난번에 문자로 인사드렸었는데 잘 지내고 계신가요?^^
고객님께 안내드릴 내용이 있어 몇 차례 연락드렸으나 연결이 어려워 문자 남겨드립니다.
보험금 청구, 계약 관련 문의, 보장내용 확인 등 보험 관련하여 궁금하신 사항이 있으시거나 도움이 필요하신 경우 언제든 편하게 연락 부탁드립니다.
통화 가능하신 시간대를 회신 주시면 고객님 편하신 시간에 맞춰 연락드리겠습니다.^^
{{계절인사}}
감사합니다.
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-9",
      name: "⑨ 통화 일정 조율 감사 (콜백 예정 안내)",
      category: "일정조율",
      body: `안녕하세요.
{{고객명}} 고객님^^
바쁘신 와중에도 연락 주시고 통화 가능 시간 알려주셔서 감사합니다.
말씀 주신 대로 {{통화예정일시}} 연락드리겠습니다.
{{계절인사}}
{{통화예정일시}} 통화 때 뵙겠습니다.
감사합니다.
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
    {
      id: "tpl-db-10",
      name: "⑩ 미팅 후 감사 인사 및 다음 일정 안내",
      category: "미팅후",
      body: `안녕하세요.
{{고객명}} 고객님^-^
오늘 만나 뵙게 되어 반가웠습니다. 귀한 시간 내어주셔서 감사합니다.
고객님과 {{가족구성원}} 보험 보장분석 자료를 잘 준비하여 다음에 뵐 때 도움이 될 수 있도록 안내드리겠습니다.
일정 관련해서는 {{다음연락예정일}}에 다시 연락드려 편하신 시간을 확인하겠습니다.
{{계절인사}}
[DB손해보험 보상청구서비스 담당자 {{설계사명}}]
{{설계사전화번호}}
{{설계사내선번호}}`,
    },
  ];

  for (const t of dbTemplates) {
    await prisma.messageTemplate.upsert({
      where: { id: t.id },
      update: { category: t.category, body: t.body, name: t.name },
      create: { id: t.id, name: t.name, category: t.category, body: t.body },
    });
  }

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
