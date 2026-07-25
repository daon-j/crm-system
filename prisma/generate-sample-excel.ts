import ExcelJS from "exceljs";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("고객DB");

  const headers = [
    "이름", "생년월일", "연락처", "주소", "직업", "보험사", "상품명", "가입일",
    "이메일", "고객등급", "만기일", "월보험료", "메모",
  ];
  sheet.addRow(headers);
  sheet.getRow(1).eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    if (colNumber <= 8) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEAFB" } };
  });
  sheet.columns.forEach((col) => (col.width = 16));

  sheet.addRow(["오지훈", "1991-04-11", "010-2000-0001", "서울시 용산구 이태원로 12", "회사원", "DB손해보험", "실손보험", "2026-07-01", "ojihoon@example.com", "B", "", "31000", "지인 소개"]);
  sheet.addRow(["윤서아", "1987-09-23", "010-2000-0002", "대전시 유성구 대학로 5", "약사", "삼성화재", "암보험", "2026-06-15", "", "A", "2036-06-15", "58000", "약국 운영"]);
  sheet.addRow(["임하늘", "1996-12-05", "010-2000-0003", "광주시 서구 상무대로 88", "간호사", "현대해상", "운전자보험", "2026-07-10", "haneul@example.com", "", "", "21000", ""]);

  const buffer = await workbook.xlsx.writeBuffer();
  const fs = await import("fs");
  fs.writeFileSync("sample-customer-db.xlsx", Buffer.from(buffer));
  console.log("샘플 엑셀 파일 생성 완료: sample-customer-db.xlsx");
}

main();
