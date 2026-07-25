import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
function daysFromToday(n: number, hour = 10, minute = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}
function hoursFromNow(n: number) {
  return new Date(now.getTime() + n * 60 * 60 * 1000);
}

async function main() {
  console.log("데모 데이터 생성 시작...");

  const batchJune = await prisma.customerBatch.upsert({
    where: { name: "2026년 6월DB" },
    update: {},
    create: { name: "2026년 6월DB" },
  });
  const batchJuly = await prisma.customerBatch.upsert({
    where: { name: "2026년 7월DB" },
    update: {},
    create: { name: "2026년 7월DB" },
  });

  const resultTypes = await prisma.callResultType.findMany();
  const rt = Object.fromEntries(resultTypes.map((r) => [r.name, r]));

  await prisma.callResultType.upsert({
    where: { name: "재상담필요" },
    update: {},
    create: { name: "재상담필요", isDefault: false },
  });

  // 1) 김철수 - 생일 오늘, 만기임박 계약, 방문 2차 완료 + 오늘 방문 예정, 콜상담 다양
  const cheolsu = await prisma.customer.create({
    data: {
      name: "김철수",
      birthDate: new Date(1985, now.getMonth(), now.getDate()),
      phone: "010-1000-0001",
      address: "서울시 강남구 테헤란로 101",
      job: "자영업(카페 운영)",
      email: "cheolsu@example.com",
      grade: "A",
      marketingOptIn: true,
      memo: "골프 좋아함, 아들 고3 수험생",
      batchId: batchJune.id,
    },
  });
  await prisma.contract.create({
    data: {
      customerId: cheolsu.id,
      insurer: "DB손해보험",
      productName: "실손보험",
      category: "실손보험",
      joinDate: new Date(2020, 0, 1),
      expiryDate: daysFromToday(20),
      premium: 32000,
      status: "ACTIVE",
    },
  });
  await prisma.contract.create({
    data: {
      customerId: cheolsu.id,
      insurer: "삼성화재",
      productName: "암보험",
      category: "암보험",
      joinDate: new Date(2021, 4, 1),
      expiryDate: daysFromToday(400),
      premium: 45000,
      status: "ACTIVE",
    },
  });
  // 완료된 방문 2건 (1차, 2차)
  for (const [n, dayOffset] of [[1, -30], [2, -10]] as const) {
    await prisma.calendarEvent.create({
      data: {
        title: `김철수 고객 방문`,
        type: "VISIT",
        startAt: daysFromToday(dayOffset, 14, 0),
        customerId: cheolsu.id,
        memo: n === 1 ? "실손보험 설명 및 니즈 파악" : "암보험 특약 추가 상담",
        companion: n === 2 ? "나은지 팀장" : undefined,
        area: "강남",
      },
    });
    await prisma.consultation.create({
      data: {
        customerId: cheolsu.id,
        content: n === 1 ? "실손보험 설명 및 니즈 파악" : "암보험 특약 추가 상담",
        resultTypeId: rt["방문확정"]?.id,
        visitDate: daysFromToday(dayOffset, 14, 0),
        createdAt: daysFromToday(dayOffset, 9, 0),
      },
    });
  }
  // 오늘 오후 방문 예정 (아직 안 지남) - 대시보드 "오늘의 방문" 히어로 테스트용
  await prisma.calendarEvent.create({
    data: {
      title: "김철수 고객 방문",
      type: "VISIT",
      startAt: hoursFromNow(4),
      customerId: cheolsu.id,
      memo: "만기 임박 실손보험 갱신 상담 + 신규 상품 안내",
      companion: "박서준 인턴",
      area: "강남",
    },
  });
  await prisma.consultation.create({
    data: {
      customerId: cheolsu.id,
      content: "만기 임박 실손보험 갱신 상담 + 신규 상품 안내",
      resultTypeId: rt["방문확정"]?.id,
      visitDate: hoursFromNow(4),
    },
  });
  // 부재중 이력 + 오늘 재접촉 예정
  await prisma.consultation.create({
    data: {
      customerId: cheolsu.id,
      content: "연락 시도했으나 부재중",
      resultTypeId: rt["부재중"]?.id,
      nextContactDate: today,
      createdAt: daysFromToday(-2, 11, 0),
    },
  });

  // 2) 이영희 - 김철수 소개, 방문 1차완료 + 1건 예정(미래), 계약 1건
  const younghee = await prisma.customer.create({
    data: {
      name: "이영희",
      birthDate: new Date(1990, 2, 12),
      phone: "010-1000-0002",
      address: "경기도 성남시 분당구 판교로 200",
      job: "회사원(IT)",
      email: "younghee@example.com",
      grade: "B",
      marketingOptIn: true,
      memo: "재택근무, 딸 초등학생",
      batchId: batchJuly.id,
      referredById: cheolsu.id,
    },
  });
  await prisma.contract.create({
    data: {
      customerId: younghee.id,
      insurer: "현대해상",
      productName: "운전자보험",
      category: "운전자보험",
      joinDate: new Date(2023, 5, 1),
      expiryDate: daysFromToday(200),
      premium: 18000,
      status: "ACTIVE",
    },
  });
  await prisma.calendarEvent.create({
    data: {
      title: "이영희 고객 방문",
      type: "VISIT",
      startAt: daysFromToday(-15, 15, 0),
      customerId: younghee.id,
      memo: "운전자보험 가입 상담",
      area: "분당",
    },
  });
  await prisma.consultation.create({
    data: {
      customerId: younghee.id,
      content: "운전자보험 가입 상담",
      resultTypeId: rt["방문확정"]?.id,
      visitDate: daysFromToday(-15, 15, 0),
      createdAt: daysFromToday(-15, 10, 0),
    },
  });
  // 다가오는 방문예약 (미래) - 대시보드 "다가오는 방문예약" 카드 테스트용
  await prisma.calendarEvent.create({
    data: {
      title: "이영희 고객 방문",
      type: "VISIT",
      startAt: daysFromToday(4, 11, 0),
      customerId: younghee.id,
      memo: "자녀 보험 추가 상담",
      companion: "김철수",
      area: "분당",
    },
  });
  await prisma.consultation.create({
    data: {
      customerId: younghee.id,
      content: "자녀 보험 추가 상담 방문 예약",
      resultTypeId: rt["방문확정"]?.id,
      visitDate: daysFromToday(4, 11, 0),
    },
  });

  // 3) 강태오 - 이영희가 소개 (2단 소개체인), 상담중(계약/방문 없음), 부재중 콜 1건
  const taeoh = await prisma.customer.create({
    data: {
      name: "강태오",
      birthDate: new Date(1992, 7, 20),
      phone: "010-1000-0003",
      address: "서울시 마포구 월드컵로 55",
      job: "프리랜서 디자이너",
      grade: "B",
      batchId: batchJuly.id,
      referredById: younghee.id,
    },
  });
  const taeohConsult = await prisma.consultation.create({
    data: {
      customerId: taeoh.id,
      content: "연락드렸으나 부재중",
      resultTypeId: rt["부재중"]?.id,
      createdAt: daysFromToday(-1, 15, 0),
    },
  });
  if (rt["부재중"]?.messageTemplateId) {
    const tpl = await prisma.messageTemplate.findUnique({ where: { id: rt["부재중"].messageTemplateId } });
    if (tpl) {
      await prisma.message.create({
        data: {
          customerId: taeoh.id,
          templateId: tpl.id,
          content: tpl.body.replace("{{고객명}}", taeoh.name).replace("{{설계사명}}", "담당 설계사"),
          status: "PENDING",
          triggerType: tpl.category,
          createdAt: taeohConsult.createdAt,
        },
      });
    }
  }

  // 4) 박민수 - 순수 리드, 이력 없음 (엑셀 업로드로 막 들어온 느낌)
  await prisma.customer.create({
    data: {
      name: "박민수",
      birthDate: new Date(1995, 10, 3),
      phone: "010-1000-0004",
      address: "인천시 연수구 송도과학로 12",
      job: "회사원(제조업)",
      grade: "C",
      batchId: batchJuly.id,
    },
  });

  // 5) 정수진 - 거절 이력
  const sujin = await prisma.customer.create({
    data: {
      name: "정수진",
      birthDate: new Date(1988, 5, 25),
      phone: "010-1000-0005",
      address: "서울시 서초구 반포대로 33",
      job: "공무원",
      grade: "B",
      batchId: batchJune.id,
    },
  });
  await prisma.consultation.create({
    data: {
      customerId: sujin.id,
      content: "이미 다른 보험사 상품 가입 중이라 상담 거절",
      resultTypeId: rt["거절"]?.id,
      createdAt: daysFromToday(-5, 13, 0),
    },
  });

  // 6) 최영호 - 만기 D-5 임박 계약 (배치 없음, 소개 없음)
  const younghoo = await prisma.customer.create({
    data: {
      name: "최영호",
      birthDate: new Date(1975, 1, 14),
      phone: "010-1000-0006",
      address: "부산시 해운대구 센텀중앙로 78",
      job: "회사원(금융업)",
      grade: "A",
      memo: "만기 임박 - 우선 연락 필요",
    },
  });
  await prisma.contract.create({
    data: {
      customerId: younghoo.id,
      insurer: "KB손해보험",
      productName: "종신보험",
      category: "종신보험",
      joinDate: new Date(2016, 1, 14),
      expiryDate: daysFromToday(5),
      premium: 68000,
      status: "ACTIVE",
    },
  });

  // 캘린더 - 교육/기타 일정
  await prisma.calendarEvent.create({
    data: {
      title: "보험상품 심화 세미나",
      type: "TRAINING",
      startAt: daysFromToday(1, 15, 0),
      memo: "신규 종신보험 상품 특징 및 판매 전략",
    },
  });
  await prisma.calendarEvent.create({
    data: {
      title: "세무서 서류 제출",
      type: "CUSTOM",
      startAt: daysFromToday(3, 10, 0),
    },
  });

  // 학습노트
  await prisma.studyNote.create({
    data: {
      date: today,
      category: "MORNING_MEETING",
      title: "7월 실손보험 개정 안내",
      content: "실손보험 자기부담금 개편 내용 공유. 기존 가입자 전환 시 유의사항 정리.",
      tags: "실손보험, 제도개편",
    },
  });
  await prisma.studyNote.create({
    data: {
      date: today,
      category: "MORNING_TRAINING",
      title: "종신보험 세일즈 화법 교육",
      content: "고객 니즈 파악 질문법, 반론 대응 스크립트 실습.",
      tags: "종신보험, 화법",
    },
  });
  await prisma.studyNote.create({
    data: {
      date: daysFromToday(-1),
      category: "ETC",
      title: "경쟁사 신상품 비교",
      content: "A사, B사 최근 출시한 건강보험 특약 비교 정리.",
      tags: "경쟁사분석",
    },
  });

  console.log("데모 데이터 생성 완료");
  console.log({
    고객: [cheolsu.name, younghee.name, taeoh.name, "박민수", sujin.name, younghoo.name].join(", "),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
