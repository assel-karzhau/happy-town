"use client";

import { Archive, Check, Ellipsis, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "lesson" | "homework" | "word" | "test";

type Item = {
  id: string;
  title: string;
  secondary?: string;
  status?: string;
};

const actions: Record<Kind, { update: string; archive: string; idKey: string }> = {
  lesson: { update: "updateLesson", archive: "archiveLesson", idKey: "lessonId" },
  homework: { update: "updateHomework", archive: "archiveHomework", idKey: "homeworkId" },
  word: { update: "updateWord", archive: "archiveWord", idKey: "wordId" },
  test: { update: "updateTest", archive: "archiveTest", idKey: "testId" },
};

/**
 * Shared compact record menu. It keeps teacher mutations next to the record
 * instead of repeating the same records in a separate management section.
 */
export function TeacherActionMenu({ kind, item }: { kind: Kind; item: Item }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [secondary, setSecondary] = useState(item.secondary ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const config = actions[kind];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function run(action: string, data: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, data: { [config.idKey]: item.id, ...data } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось выполнить действие");
      setOpen(false);
      setEditing(false);
      setMessage(action === config.archive ? "Запись перенесена в архив" : "Изменения сохранены");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(config.update, kind === "word" ? { english: title, translation: secondary } : { title });
  }

  return <div className="record-action-menu" ref={root}>
    <button className="icon-btn record-action-trigger" type="button" aria-label={`Действия: ${item.title}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Ellipsis size={19} />
    </button>
    {open && <div className="record-action-popover" role="menu">
      <button type="button" role="menuitem" onClick={() => { setEditing(true); setOpen(false); }}><Pencil size={16} />Редактировать</button>
      <button type="button" role="menuitem" className="destructive" disabled={busy} onClick={() => {
        if (window.confirm(`Переместить «${item.title}» в архив?`)) void run(config.archive);
      }}>{busy ? <Loader2 className="spin" size={16} /> : <Archive size={16} />}В архив</button>
    </div>}
    {editing && <div className="dialog-layer" onMouseDown={(event) => event.target === event.currentTarget && !busy && setEditing(false)}>
      <form className="record-edit-dialog section-card" onSubmit={save} aria-label={`Редактирование: ${item.title}`}>
        <header><div><span className="eyebrow">Happy Town</span><h2>Редактировать запись</h2></div><button className="icon-btn" type="button" aria-label="Закрыть" onClick={() => setEditing(false)}><X size={18} /></button></header>
        <label><span>{kind === "word" ? "Слово" : "Название"}</span><input value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus /></label>
        {kind === "word" && <label><span>Перевод</span><input value={secondary} onChange={(event) => setSecondary(event.target.value)} required /></label>}
        <footer><button className="btn secondary" type="button" onClick={() => setEditing(false)} disabled={busy}>Отмена</button><button className="btn" disabled={busy}>{busy ? <Loader2 className="spin" /> : <Check size={17} />}Сохранить</button></footer>
      </form>
    </div>}
    {message && <span className="record-action-message" role="status">{message}</span>}
  </div>;
}
