import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/projects/query-state";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelMeta,
  PanelTitle,
} from "@/components/ui/panel";
import { ROW_HOVER } from "@/components/ui/row-hover";
import { Textarea } from "@/components/ui/textarea";
import { strings } from "@/i18n/strings";
import { getLocale } from "@/lib/utils";

interface LogbookNote {
  id: string;
  text: string;
  updatedAt: string;
}

let noteTimestampFormat: Intl.DateTimeFormat | null = null;

function formatNoteTimestamp(iso: string): string {
  noteTimestampFormat ??= new Intl.DateTimeFormat(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return noteTimestampFormat.format(new Date(iso));
}

function storageKey(projectId: string): string {
  return `devtrackr-logbook-${projectId}`;
}

function loadNotes(projectId: string): LogbookNote[] {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is LogbookNote =>
        typeof n === "object" &&
        n !== null &&
        typeof (n as LogbookNote).id === "string" &&
        typeof (n as LogbookNote).text === "string",
    );
  } catch {
    return [];
  }
}

export function LogbookTab({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<LogbookNote[]>(() => loadNotes(projectId));
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setNotes(loadNotes(projectId));
    setDraft("");
    setEditingId(null);
  }, [projectId]);

  const persist = (next: LogbookNote[]) => {
    setNotes(next);
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(next));
    } catch {
      // storage unavailable; notes stay in memory for the session
    }
  };

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    persist([
      {
        id: crypto.randomUUID(),
        text,
        updatedAt: new Date().toISOString(),
      },
      ...notes,
    ]);
    setDraft("");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) return;
    persist(
      notes.map((n) =>
        n.id === editingId
          ? { ...n, text, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col gap-5">
      <section aria-label={strings.logbook.notesTitle}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{strings.logbook.notesTitle}</PanelTitle>
            <PanelMeta>{strings.logbook.notesDescription}</PanelMeta>
          </PanelHeader>
          <PanelBody className="flex flex-col gap-3">
            <label htmlFor="logbook-note-input" className="sr-only">
              {strings.logbook.notePlaceholder}
            </label>
            <Textarea
              id="logbook-note-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={strings.logbook.notePlaceholder}
              rows={3}
            />
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 self-start"
              onClick={handleAdd}
              disabled={!draft.trim()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {strings.logbook.addNote}
            </Button>
          </PanelBody>
        </Panel>
      </section>

      {notes.length === 0 ? (
        <EmptyState
          title={strings.logbook.emptyTitle}
          description={strings.logbook.emptyDescription}
        />
      ) : (
        <Panel>
          <PanelHeader>
            <PanelTitle>{strings.logbook.tab}</PanelTitle>
            <PanelMeta>{notes.length}</PanelMeta>
          </PanelHeader>
          <ul className="divide-y divide-border">
            {notes.map((note) => (
              <li key={note.id} className={ROW_HOVER}>
                {editingId === note.id ? (
                  <div className="flex flex-col gap-3 px-5 py-3.5">
                    <label
                      htmlFor={`logbook-edit-${note.id}`}
                      className="sr-only"
                    >
                      {strings.logbook.editNote}
                    </label>
                    <Textarea
                      id={`logbook-edit-${note.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editText.trim()}
                      >
                        {strings.logbook.saveNote}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        {strings.logbook.cancelEdit}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {note.text}
                      </p>
                      <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase tabular-nums">
                        {formatNoteTimestamp(note.updatedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${strings.logbook.editNote}: ${note.text.slice(0, 30)}`}
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.text);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${strings.logbook.deleteNote}: ${note.text.slice(0, 30)}`}
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
