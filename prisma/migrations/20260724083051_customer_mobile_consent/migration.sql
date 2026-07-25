-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "residentNumber" TEXT,
    "birthDate" DATETIME,
    "phone" TEXT,
    "address" TEXT,
    "job" TEXT,
    "email" TEXT,
    "grade" TEXT NOT NULL DEFAULT 'B',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "mobileConsent" BOOLEAN NOT NULL DEFAULT false,
    "mobileConsentDate" DATETIME,
    "memo" TEXT,
    "batchId" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CustomerBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "batchId", "birthDate", "createdAt", "email", "gender", "grade", "id", "job", "marketingOptIn", "memo", "name", "phone", "referredById", "residentNumber", "updatedAt") SELECT "address", "batchId", "birthDate", "createdAt", "email", "gender", "grade", "id", "job", "marketingOptIn", "memo", "name", "phone", "referredById", "residentNumber", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_batchId_idx" ON "Customer"("batchId");
CREATE INDEX "Customer_referredById_idx" ON "Customer"("referredById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
