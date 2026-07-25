"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { resolveBatchId } from "@/lib/batch";
import { revalidatePath } from "next/cache";

export type ImportState = {
  ready: boolean;
  successCount: number;
  errors: { row: number; reason: string }[];
};

const HEADER_KEYS: Record<string, string> = {
  이름: "name",
  생년월일: "birthDate",
  연락처: "phone",
  주소: "address",
  직업: "job",
  성별: "gender",
  주민등록번호: "residentNumber",
  모바일동의: "mobileConsent",
  모바일동의일자: "mobileConsentDate",
  이메일: "email",
  고객등급: "grade",
  보험사: "insurer",
  상품명: "productName",
  가입일: "joinDate",
  만기일: "expiryDate",
  월보험료: "premium",
  메모: "memo",
};

const REQUIRED_KEYS = ["name", "birthDate", "phone", "address", "job", "gender", "residentNumber"];
const REQUIRED_LABELS: Record<string, string> = {
  name: "이름",
  birthDate: "생년월일",
  phone: "연락처",
  address: "주소",
  job: "직업",
  gender: "성별",
  residentNumber: "주민등록번호",
};
const CONTRACT_KEYS = ["insurer", "productName", "joinDate"];
const CONTRACT_LABELS: Record<string, string> = {
  insurer: "보험사",
  productName: "상품명",
  joinDate: "가입일",
};

function cellString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if (typeof v.text === "string") return v.text;
    if (Array.isArray(v.richText)) {
      return v.richText.map((t) => (t as { text?: string }).text ?? "").join("");
    }
    if (v.result !== undefined) return String(v.result);
    return "";
  }
  return String(value).trim();
}

export async function importCustomers(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ready: true, successCount: 0, errors: [{ row: 0, reason: "엑셀 파일을 선택해주세요" }] };
  }

  const batchId = await resolveBatchId(formData);
  if (!batchId) {
    return {
      ready: true,
      successCount: 0,
      errors: [{ row: 0, reason: "배치를 선택하거나 새 배치명을 입력해주세요" }],
    };
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @types/node's generic Buffer<T> vs exceljs's own Buffer type don't line up
    await workbook.xlsx.load(Buffer.from(buffer) as any);
  } catch {
    return {
      ready: true,
      successCount: 0,
      errors: [{ row: 0, reason: "엑셀 파일을 읽을 수 없습니다. .xlsx 파일인지 확인해주세요" }],
    };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { ready: true, successCount: 0, errors: [{ row: 0, reason: "시트를 찾을 수 없습니다" }] };
  }

  const colKeyByIndex = new Map<number, string>();
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const header = cellString(cell.value).trim();
    const key = HEADER_KEYS[header];
    if (key) colKeyByIndex.set(colNumber, key);
  });

  const foundKeys = new Set(colKeyByIndex.values());
  const missingHeaders = REQUIRED_KEYS.filter((k) => !foundKeys.has(k)).map((k) => REQUIRED_LABELS[k]);
  if (missingHeaders.length > 0) {
    return {
      ready: true,
      successCount: 0,
      errors: [{ row: 1, reason: `필수 컬럼이 없습니다: ${missingHeaders.join(", ")} (템플릿을 다시 확인해주세요)` }],
    };
  }

  const existingPhones = new Set(
    (await prisma.customer.findMany({ select: { phone: true } }))
      .map((c) => c.phone)
      .filter((p): p is string => !!p),
  );

  const errors: { row: number; reason: string }[] = [];
  let successCount = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const record: Record<string, string> = {};
    let hasAnyValue = false;
    colKeyByIndex.forEach((key, colNumber) => {
      const text = cellString(row.getCell(colNumber).value).trim();
      record[key] = text;
      if (text) hasAnyValue = true;
    });
    if (!hasAnyValue) continue;

    const missing = REQUIRED_KEYS.filter((k) => !record[k]).map((k) => REQUIRED_LABELS[k]);
    if (missing.length > 0) {
      errors.push({ row: rowNumber, reason: `필수값 누락: ${missing.join(", ")}` });
      continue;
    }

    if (!["남", "여"].includes(record.gender)) {
      errors.push({ row: rowNumber, reason: "성별은 '남' 또는 '여'로 입력해주세요" });
      continue;
    }

    const mobileConsentRaw = record.mobileConsent ? record.mobileConsent.trim().toUpperCase() : "N";
    if (!["Y", "N"].includes(mobileConsentRaw)) {
      errors.push({ row: rowNumber, reason: "모바일동의는 'Y' 또는 'N'으로 입력해주세요" });
      continue;
    }
    let mobileConsentDate: Date | null = null;
    if (mobileConsentRaw === "Y") {
      if (!record.mobileConsentDate) {
        errors.push({ row: rowNumber, reason: "모바일동의가 'Y'인 경우 모바일동의일자는 필수입니다" });
        continue;
      }
      mobileConsentDate = new Date(record.mobileConsentDate);
      if (isNaN(mobileConsentDate.getTime())) {
        errors.push({ row: rowNumber, reason: "날짜 형식을 확인해주세요 (모바일동의일자)" });
        continue;
      }
    }

    const birthDate = new Date(record.birthDate);
    if (isNaN(birthDate.getTime())) {
      errors.push({ row: rowNumber, reason: "날짜 형식을 확인해주세요 (생년월일)" });
      continue;
    }

    const missingContract = record.productName
      ? CONTRACT_KEYS.filter((k) => !record[k]).map((k) => CONTRACT_LABELS[k])
      : [];
    if (missingContract.length > 0) {
      errors.push({ row: rowNumber, reason: `상품명을 넣으려면 함께 필요: ${missingContract.join(", ")}` });
      continue;
    }

    let joinDate: Date | null = null;
    if (record.productName) {
      joinDate = new Date(record.joinDate);
      if (isNaN(joinDate.getTime())) {
        errors.push({ row: rowNumber, reason: "날짜 형식을 확인해주세요 (가입일)" });
        continue;
      }
    }

    if (existingPhones.has(record.phone)) {
      errors.push({ row: rowNumber, reason: `이미 등록된 연락처입니다 (${record.phone})` });
      continue;
    }

    const expiryDate = record.expiryDate ? new Date(record.expiryDate) : null;
    const grade = ["A", "B", "C"].includes(record.grade) ? record.grade : "B";
    const premiumDigits = record.premium ? record.premium.replace(/[^0-9]/g, "") : "";
    const premium = premiumDigits ? parseInt(premiumDigits, 10) : null;

    const customer = await prisma.customer.create({
      data: {
        name: record.name,
        gender: record.gender,
        residentNumber: record.residentNumber,
        birthDate,
        phone: record.phone,
        address: record.address,
        job: record.job,
        email: record.email || null,
        grade,
        mobileConsent: mobileConsentRaw === "Y",
        mobileConsentDate,
        memo: record.memo || null,
        batchId,
      },
    });

    if (record.productName && joinDate) {
      await prisma.contract.create({
        data: {
          customerId: customer.id,
          insurer: record.insurer,
          productName: record.productName,
          category: "기타",
          joinDate,
          expiryDate: expiryDate && !isNaN(expiryDate.getTime()) ? expiryDate : null,
          premium,
          source: "PRE_EXISTING",
        },
      });
    }

    existingPhones.add(record.phone);
    successCount++;
  }

  revalidatePath("/customers");
  revalidatePath("/contracts");

  return { ready: true, successCount, errors };
}
