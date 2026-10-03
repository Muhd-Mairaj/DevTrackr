import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/projects/query-state";
import { Button } from "@/components/ui/button";
import { strings } from "@/i18n/strings";

interface LogbookNote {
  id: string;
  text: string;
  updatedAt: string;
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
    <div className="flex flex-col gap-4">
      <section aria-label={strings.logbook.notesTitle}>
        <h2 className="text-sm font-semibold">{strings.logbook.notesTitle}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {strings.logbook.notesDescription}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <label htmlFor="logbook-note-input" className="sr-only">
            {strings.logbook.notePlaceholder}
          </label>
          <textarea
            id="logbook-note-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={strings.logbook.notePlaceholder}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            className="gap-1.5 self-start"
            onClick={handleAdd}
            disabled={!draft.trim()}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {strings.logbook.addNote}
          </Button>
        </div>
      </section>

      {notes.length === 0 ? (
        <EmptyState
          title={strings.logbook.emptyTitle}
          description={strings.logbook.emptyDescription}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-border bg-card px-3 py-2"
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`logbook-edit-${note.id}`}
                    className="sr-only"
                  >
                    {strings.logbook.editNote}
                  </label>
                  <textarea
                    id={`logbook-edit-${note.id}`}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                    >
                      {strings.logbook.saveNote}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      {strings.logbook.cancelEdit}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {note.text}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
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
                      size="sm"
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
      )}
    </div>
  );
}
