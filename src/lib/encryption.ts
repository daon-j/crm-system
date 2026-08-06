import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// scrypt는 일부러 느리게(메모리·CPU 하드) 설계된 KDF라서 encrypt/decrypt를 부를 때마다 다시 계산하면
// 안 된다. ENCRYPTION_KEY는 프로세스 실행 중 바뀌지 않으므로 최초 1회만 계산해서 재사용한다.
let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY 환경변수가 설정되어 있지 않습니다");
  cachedKey = scryptSync(secret, "insurance-crm-salt", 32);
  return cachedKey;
}

// 주민등록번호 등 고유식별정보를 저장 전 암호화 (AES-256-GCM)
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("잘못된 암호화 형식입니다");
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

// 이미 암호화된 값인지 판별 (iv:authTag:ciphertext 형태, 각 hex)
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}
