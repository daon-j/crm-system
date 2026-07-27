/*
  Warnings:

  - You are about to drop the column `tier` on the `VisitChecklist` table. All the data in the column will be lost.
  - Added the required column `seq` to the `VisitChecklist` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VisitChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VisitChecklist" ("createdAt", "id", "items", "updatedAt", "userId") SELECT "createdAt", "id", "items", "updatedAt", "userId" FROM "VisitChecklist";
DROP TABLE "VisitChecklist";
ALTER TABLE "new_VisitChecklist" RENAME TO "VisitChecklist";
CREATE UNIQUE INDEX "VisitChecklist_userId_seq_key" ON "VisitChecklist"("userId", "seq");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
