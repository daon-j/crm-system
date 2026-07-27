import "dotenv/config";
import Database from "better-sqlite3";
import { encrypt, isEncrypted } from "../src/lib/encryption";

const OWNER_EMAIL = process.argv[2];
if (!OWNER_EMAIL) {
  console.error("사용법: npx tsx scripts/migrate-legacy-data.ts <소유자이메일>");
  process.exit(1);
}

interface UserRow {
  id: string;
  email: string;
}

interface CustomerRow {
  id: string;
  residentNumber: string | null;
}

const db = new Database("./dev.db");

const owner = db.prepare("SELECT id, email FROM User WHERE email = ?").get(OWNER_EMAIL) as
  | UserRow
  | undefined;
if (!owner) {
  console.error(`계정을 찾을 수 없습니다: ${OWNER_EMAIL}`);
  process.exit(1);
}

const tables = ["Customer", "CustomerBatch", "Message", "StudyNote", "CalendarEvent", "AppSetting", "Todo"];
for (const table of tables) {
  const result = db.prepare(`UPDATE ${table} SET userId = ? WHERE userId IS NULL`).run(owner.id);
  console.log(`${table}: ${result.changes}건 배정`);
}

// CallResultType/MessageTemplate은 seed.ts가 만든 고정 id(crt-*, tpl-*)는 전체 공용 기본값으로 남겨두고,
// 그 외(사용자가 설정 화면에서 직접 추가한 커스텀 항목)만 소유자에게 배정한다.
const crtResult = db
  .prepare("UPDATE CallResultType SET userId = ? WHERE userId IS NULL AND id NOT LIKE 'crt-%'")
  .run(owner.id);
console.log(`CallResultType(커스텀): ${crtResult.changes}건 배정`);

const tplResult = db
  .prepare("UPDATE MessageTemplate SET userId = ? WHERE userId IS NULL AND id NOT LIKE 'tpl-%'")
  .run(owner.id);
console.log(`MessageTemplate(커스텀): ${tplResult.changes}건 배정`);

const customers = db
  .prepare("SELECT id, residentNumber FROM Customer WHERE residentNumber IS NOT NULL")
  .all() as CustomerRow[];
let encryptedCount = 0;
for (const c of customers) {
  if (!c.residentNumber || isEncrypted(c.residentNumber)) continue;
  const encrypted = encrypt(c.residentNumber);
  db.prepare("UPDATE Customer SET residentNumber = ? WHERE id = ?").run(encrypted, c.id);
  encryptedCount++;
}
console.log(`주민등록번호 암호화: ${encryptedCount}건`);

db.close();
console.log(`마이그레이션 완료 (소유자: ${owner.email})`);
