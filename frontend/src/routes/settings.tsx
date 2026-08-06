import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useState } from "react";
import { DayStamp } from "@/components/day-stamp";
import { GithubSettingsCard } from "@/components/settings/github-settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { strings } from "@/ii8n/strings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type ColumnKind = "TIME" | "DURATION" | "SOURCE" | "DESCRIPTION" | "CUSTOM";

interface Column {
  id: string;
  name: string;
  kind: ColumnKind;
  builtin: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "time", name: "Time", kind: "TIME", builtin: true },
  { id: "duration", name: "Duration", kind: "DURATION", builtin: true },
  { id: "source", name: "Source", kind: "SOURCE", builtin: true },
  {
    id: "description",
    name: "Description",
    kind: "DESCRIPTION",
    builtin: true,
  },
];

const STORAGE_KEY = "devtrackr.logbook.columns";

function loadColumns(): Column[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Column[];
      const valid =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (c) =>
            typeof c === "object" &&
            c &&
            typeof c.id === "string" &&
            typeof c.name === "string",
        );
      if (valid) return parsed;
    }
  } catch {
    // corrupted storage falls back to defaults
  }
  return DEFAULT_COLUMNS;
}

function SettingsPage() {
  const [columns, setColumns] = useState<Column[]>(loadColumns);

  const persist = (next: Column[]) => {
    setColumns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  const rename = (id: string, name: string) => {
    persist(columns.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const remove = (id: string) => {
    persist(columns.filter((c) => c.id !== id));
  };

  const addCustom = () => {
    const next = [
      ...columns,
      {
        id: crypto.randomUUID(),
        name: "",
        kind: "CUSTOM" as const,
        builtin: false,
      },
    ];
    persist(next);
  };

  const KIND_LABELS: Record<ColumnKind, string> = {
    TIME: strings.settings.columnTime,
    DURATION: strings.settings.columnDuration,
    SOURCE: strings.settings.columnSource,
    DESCRIPTION: strings.settings.columnDescription,
    CUSTOM: strings.settings.columnCustom,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DayStamp date={new Date()} />
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {strings.settings.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {strings.settings.subtitle}
        </p>
      </div>

      <section className="max-w-xl rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">
          {strings.settings.logbookColumns}
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className="flex items-center gap-2 rounded-md border border-edge bg-background px-3 py-2"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={strings.settings.columnMoveUp}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={strings.settings.columnMoveDown}
                  onClick={() => move(index, 1)}
                  disabled={index === columns.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <span className="w-20 font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground">
                {KIND_LABELS[column.kind]}
              </span>
              <Input
                value={column.name}
                onChange={(e) => rename(column.id, e.target.value)}
                placeholder={strings.settings.columnNamePlaceholder}
                className="flex-1"
                aria-label={
                  column.name || strings.settings.columnNamePlaceholder
                }
              />
              {!column.builtin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(column.id)}
                  aria-label={strings.settings.columnRemoveLabel}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          id="add-column-btn"
          variant="secondary"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={addCustom}
        >
          <Plus className="size-3.5" />
          {strings.settings.columnAdd}
        </Button>
      </section>

      <GithubSettingsCard />
    </div>
  );
}
