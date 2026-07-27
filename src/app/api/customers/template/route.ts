import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";

const REQUIRED_HEADERS = ["이름", "생년월일", "연락처", "주소", "직업", "성별", "주민등록번호"];
const OPTIONAL_HEADERS = [
  "이메일",
  "고객등급",
  "모바일동의",
  "모바일동의일자",
  "보험사",
  "상품명",
  "가입일",
  "만기일",
  "월보험료",
  "메모",
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("고객DB");

  const headers = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
  sheet.addRow(headers);
  sheet.getRow(1).eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    if (colNumber <= REQUIRED_HEADERS.length) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEAFB" } };
    }
  });
  sheet.columns.forEach((col) => {
    col.width = 16;
  });

  sheet.addRow([
    "홍길동",
    "1990-01-01",
    "010-1234-5678",
    "서울시 강남구",
    "회사원",
    "남",
    "901231-1234567",
    "hong@example.com",
    "B",
    "N",
    "",
    "DB손해보험",
    "실손보험",
    "2026-01-01",
    "",
    "35000",
    "지인 소개, 기존 가입상품 있음",
  ]);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="customer_db_template.xlsx"',
    },
  });
}
