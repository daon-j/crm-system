const CATEGORY_LABEL: Record<string, string> = {
  MORNING_MEETING: "정보미팅",
  MORNING_TRAINING: "오전교육",
  ETC: "기타",
};

export async function syncStudyNoteToNotion(note: {
  title: string;
  content: string;
  category: string;
  date: Date;
  tags: string | null;
}) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_STUDY_NOTES_DB_ID;
  if (!apiKey || !databaseId) return;

  const tagNames = note.tags
    ? note.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
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
    }
  } catch (err) {
    console.error("Notion sync error:", err);
  }
}
