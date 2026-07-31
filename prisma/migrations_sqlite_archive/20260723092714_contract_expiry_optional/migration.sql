-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "joinDate" DATETIME NOT NULL,
    "expiryDate" DATETIME,
    "premium" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("category", "createdAt", "customerId", "expiryDate", "id", "insurer", "joinDate", "premium", "productName", "status") SELECT "category", "createdAt", "customerId", "expiryDate", "id", "insurer", "joinDate", "premium", "productName", "status" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_customerId_idx" ON "Contract"("customerId");
CREATE INDEX "Contract_expiryDate_idx" ON "Contract"("expiryDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
