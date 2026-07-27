/*
  Warnings:

  - Made the column `userId` on table `AppSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `CalendarEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `CustomerBatch` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `StudyNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Todo` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "AppSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AppSetting" ("id", "key", "userId", "value") SELECT "id", "key", "userId", "value" FROM "AppSetting";
DROP TABLE "AppSetting";
ALTER TABLE "new_AppSetting" RENAME TO "AppSetting";
CREATE UNIQUE INDEX "AppSetting_userId_key_key" ON "AppSetting"("userId", "key");
CREATE TABLE "new_CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "customerId" TEXT,
    "memo" TEXT,
    "companion" TEXT,
    "area" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("area", "companion", "createdAt", "customerId", "endAt", "id", "memo", "startAt", "status", "title", "type", "userId") SELECT "area", "companion", "createdAt", "customerId", "endAt", "id", "memo", "startAt", "status", "title", "type", "userId" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Customer_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CustomerBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "batchId", "birthDate", "createdAt", "email", "gender", "grade", "id", "job", "marketingOptIn", "memo", "mobileConsent", "mobileConsentDate", "name", "phone", "referredById", "residentNumber", "updatedAt", "userId") SELECT "address", "batchId", "birthDate", "createdAt", "email", "gender", "grade", "id", "job", "marketingOptIn", "memo", "mobileConsent", "mobileConsentDate", "name", "phone", "referredById", "residentNumber", "updatedAt", "userId" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");
CREATE INDEX "Customer_batchId_idx" ON "Customer"("batchId");
CREATE INDEX "Customer_referredById_idx" ON "Customer"("referredById");
CREATE TABLE "new_CustomerBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CustomerBatch" ("createdAt", "id", "name", "userId") SELECT "createdAt", "id", "name", "userId" FROM "CustomerBatch";
DROP TABLE "CustomerBatch";
ALTER TABLE "new_CustomerBatch" RENAME TO "CustomerBatch";
CREATE UNIQUE INDEX "CustomerBatch_userId_name_key" ON "CustomerBatch"("userId", "name");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "triggerType" TEXT NOT NULL,
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "customerId", "id", "scheduledFor", "sentAt", "status", "templateId", "triggerType", "userId") SELECT "content", "createdAt", "customerId", "id", "scheduledFor", "sentAt", "status", "templateId", "triggerType", "userId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_userId_idx" ON "Message"("userId");
CREATE INDEX "Message_customerId_idx" ON "Message"("customerId");
CREATE INDEX "Message_status_idx" ON "Message"("status");
CREATE TABLE "new_StudyNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudyNote" ("category", "content", "createdAt", "date", "id", "tags", "title", "userId") SELECT "category", "content", "createdAt", "date", "id", "tags", "title", "userId" FROM "StudyNote";
DROP TABLE "StudyNote";
ALTER TABLE "new_StudyNote" RENAME TO "StudyNote";
CREATE INDEX "StudyNote_userId_idx" ON "StudyNote"("userId");
CREATE INDEX "StudyNote_date_idx" ON "StudyNote"("date");
CREATE INDEX "StudyNote_category_idx" ON "StudyNote"("category");
CREATE TABLE "new_Todo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Todo" ("content", "createdAt", "done", "id", "priority", "userId") SELECT "content", "createdAt", "done", "id", "priority", "userId" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
