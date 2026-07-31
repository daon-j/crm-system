-- CreateTable
CREATE TABLE "NoteAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyNoteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT,
    "content" TEXT,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteAttachment_studyNoteId_fkey" FOREIGN KEY ("studyNoteId") REFERENCES "StudyNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NoteAttachment_studyNoteId_idx" ON "NoteAttachment"("studyNoteId");
