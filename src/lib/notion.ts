import { readFile } from "fs/promises";
import path from "path";

const NOTION_VERSION = "2026-03-11";
const FILES_PROPERTY_NAME = "파일과 미디어";

const CATEGORY_LABEL: Record<string, string> = {
  MORNING_MEETING: "정보미팅",
  MORNING_TRAINING: "오전교육",
  ETC: "기타",
};

type NoteAttachmentForSync = {
  type: string;
  filePath: string | null;
  originalName: string;
  mimeType: string | null;
};

type AuthHeaders = { Authorization: string; "Notion-Version": string };

export async function syncStudyNoteToNotion(
  note: { title: string; content: string; category: string; date: Date; tags: string | null },
  attachments: NoteAttachmentForSync[] = [],
) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_STUDY_NOTES_DB_ID;
  if (!apiKey || !databaseId) return;

  const authHeaders: AuthHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
  };

  const tagNames = note.tags
    ? note.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          제목: { title: [{ text: { content: note.title } }] },
          날짜: { date: { start: note.date.toISOString().slice(0, 10) } },
          구분: { select: { name: CATEGORY_LABEL[note.category] ?? note.category } },
          내용: { rich_text: [{ text: { content: note.content } }] },
          태그: { multi_select: tagNames.map((name) => ({ name })) },
        },
      }),
    });

    if (!res.ok) {
      console.error("Notion sync failed:", res.status, await res.text());
      return;
    }

    const page = await res.json();
    const images = attachments.filter((a) => a.type === "IMAGE" && a.filePath);
    if (images.length === 0) return;

    const uploaded: { fileUploadId: string; originalName: string }[] = [];
    for (const image of images) {
      const fileUploadId = await createAndSendFileUpload(image, authHeaders);
      if (fileUploadId) uploaded.push({ fileUploadId, originalName: image.originalName });
    }
    if (uploaded.length === 0) return;

    // 1) 페이지를 열면 바로 보이도록 본문에 이미지 블록 추가
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        children: uploaded.map((u) => ({
          type: "image",
          image: { type: "file_upload", file_upload: { id: u.fileUploadId } },
        })),
      }),
    });
    if (!blocksRes.ok) {
      console.error("Notion image block attach failed:", blocksRes.status, await blocksRes.text());
    }

    // 2) 데이터베이스 테이블 뷰(파일과 미디어 컬럼)에서도 바로 보이도록 속성에도 채움
    const propsRes = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: {
          [FILES_PROPERTY_NAME]: {
            files: uploaded.map((u) => ({
              type: "file_upload",
              file_upload: { id: u.fileUploadId },
              name: u.originalName,
            })),
          },
        },
      }),
    });
    if (!propsRes.ok) {
      console.error("Notion files property update failed:", propsRes.status, await propsRes.text());
    }
  } catch (err) {
    console.error("Notion sync error:", err);
  }
}

// 노션 File Upload API로 이미지 파일 자체를 올린다.
// (외부 URL 참조 방식은 이 앱이 공개 주소로 배포되지 않으면 노션이 이미지를 가져오지 못하고,
// 나중에 배포 주소가 바뀌면 이미 올라간 이미지도 깨지므로 파일 업로드 방식을 사용)
async function createAndSendFileUpload(
  attachment: NoteAttachmentForSync,
  authHeaders: AuthHeaders,
): Promise<string | null> {
  if (!attachment.filePath) return null;

  try {
    const absPath = path.join(process.cwd(), "public", attachment.filePath);
    const fileBuffer = await readFile(absPath);
    const contentType = attachment.mimeType || "image/jpeg";

    const createRes = await fetch("https://api.notion.com/v1/file_uploads", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ filename: attachment.originalName, content_type: contentType }),
    });
    if (!createRes.ok) {
      console.error("Notion file upload create failed:", createRes.status, await createRes.text());
      return null;
    }
    const { id: fileUploadId, upload_url: uploadUrl } = await createRes.json();

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(fileBuffer)], { type: contentType }), attachment.originalName);

    const sendRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: authHeaders.Authorization, "Notion-Version": authHeaders["Notion-Version"] },
      body: form,
    });
    if (!sendRes.ok) {
      console.error("Notion file upload send failed:", sendRes.status, await sendRes.text());
      return null;
    }

    return fileUploadId;
  } catch (err) {
    console.error("Notion file upload error:", err);
    return null;
  }
}
