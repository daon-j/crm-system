"use client";

import { useRef, useState } from "react";

function fileIcon(file: File): string {
  if (file.type.startsWith("image/")) return "🖼";
  if (file.type.startsWith("audio/")) return "🎤";
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) return "📝";
  return "📎";
}

export default function FileAttachDropzone({ name = "files" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  function syncInput(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
    setFiles(next);
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    syncInput([...files, ...Array.from(list)]);
  }

  function removeFile(index: number) {
    syncInput(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple
        accept="image/*,audio/*,.txt,text/plain"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-lg border border-dashed px-4 py-5 text-center text-sm transition-colors ${
          dragOver ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-ink-muted hover:border-ink-muted"
        }`}
      >
        사진, 녹음파일, 대본파일(.txt)을 끌어다 놓거나 클릭해서 선택하세요
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1 text-xs text-ink-2"
            >
              {fileIcon(f)} {f.name}
              <button type="button" onClick={() => removeFile(i)} className="text-ink-muted hover:text-danger">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
