import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "notes");

function classify(file: File): "IMAGE" | "AUDIO" | "TRANSCRIPT" | "FILE" {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("audio/")) return "AUDIO";
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) return "TRANSCRIPT";
  return "FILE";
}

export async function saveNoteAttachmentsFromFiles(studyNoteId: string, files: File[]) {
  const valid = files.filter((f) => f.size > 0);
  if (valid.length === 0) return [];

  const dir = path.join(UPLOAD_ROOT, studyNoteId);
  const hasBinary = valid.some((f) => classify(f) !== "TRANSCRIPT");
  if (hasBinary) await mkdir(dir, { recursive: true });

  const created = [];

  for (const file of valid) {
    const type = classify(file);

    if (type === "TRANSCRIPT") {
      const text = await file.text();
      const record = await prisma.noteAttachment.create({
        data: {
          studyNoteId,
          type: "TRANSCRIPT",
          content: text,
          originalName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size,
        },
      });
      created.push(record);
      continue;
    }

    const ext = path.extname(file.name);
    const safeName = `${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, safeName), buffer);

    const record = await prisma.noteAttachment.create({
      data: {
        studyNoteId,
        type,
        filePath: `/uploads/notes/${studyNoteId}/${safeName}`,
        originalName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      },
    });
    created.push(record);
  }

  return created;
}
