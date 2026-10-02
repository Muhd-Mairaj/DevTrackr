import { ArrowDown, ArrowUp, GripVertical, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProjectColumnItem } from "@/client/types.gen";
import { Tag } from "@/components/tag";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { useColumns, useSaveColumns } from "@/lib/columns";

const KIND_LABELS: Record<ProjectColumnItem["kind"], string> = {
  TIME: strings.columns.kindTime,
  DURATION: strings.columns.kindDuration,
  SOURCE: strings.columns.kindSource,
  DESCRIPTION: strings.columns.kindDescription,
  CUSTOM: strings.columns.kindCustom,
};

interface ColumnManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ColumnManagerDialog({
  open,
  onOpenChange,
  projectId,
}: ColumnManagerDialogProps) {
  const { toast } = useToast();
  const { data: savedColumns, isSuccess } = useColumns(projectId);
  const saveColumns = useSaveColumns(projectId);
  const [columns, setColumns] = useState<ProjectColumnItem[] | null>(null);
  const [nameError, setNameError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Stage the saved config when the dialog opens or fresh data arrives.
  useEffect(() => {
    if (open && isSuccess && savedColumns) {
      setColumns(savedColumns);
      setNameError(false);
    }
  }, [open, isSuccess, savedColumns]);

  if (columns === null) {
    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        title={strings.columns.title}
        description={strings.columns.description}
        actionLabel={strings.columns.saveButton}
        actionDisabled
        actionButtonId="save-columns-btn"
      />
    );
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    setColumns(next);
  };

  const rename = (index: number, name: string) => {
    setNameError(false);
    setColumns(columns.map((c, i) => (i === index ? { ...c, name } : c)));
  };

  const remove = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const addCustom = () => {
    setNameError(false);
    setColumns([...columns, { kind: "CUSTOM", name: "", builtin: false }]);
  };

  const handleSave = async () => {
    if (!columns) return;
    const firstEmpty = columns.findIndex((c) => !c.name.trim());
    if (firstEmpty !== -1) {
      setNameError(true);
      inputRefs.current[firstEmpty]?.focus();
      return;
    }
    const previous = savedColumns ? [...savedColumns] : null;
    try {
      await saveColumns.mutateAsync(columns);
      if (previous) {
        toast("success", strings.columns.savedToast, {
          actionLabel: strings.common.undo,
          durationMs: 8000,
          onAction: () => {
            setColumns(previous);
            saveColumns.mutate(previous, {
              onSuccess: () => toast("success", strings.columns.savedToast),
              onError: (err) => toast("error", (err as Error).message),
            });
          },
        });
      } else {
        toast("success", strings.columns.savedToast);
      }
      onOpenChange(false);
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={strings.columns.title}
      description={strings.columns.description}
      actionLabel={strings.columns.saveButton}
      onAction={handleSave}
      isPending={saveColumns.isPending}
      actionButtonId="save-columns-btn"
    >
      <div className="flex flex-col gap-1.5">
        {columns.map((column, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: staged list without stable ids; kind plus position keeps rows distinct
            key={`${column.kind}-${index}`}
            className="flex items-center gap-2 rounded border border-border bg-background px-2.5 py-2"
          >
            <GripVertical
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground/70"
            />
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={strings.columns.moveUp}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-40"
              >
                <ArrowUp aria-hidden="true" className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={strings.columns.moveDown}
                onClick={() => move(index, 1)}
                disabled={index === columns.length - 1}
                className="rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-40"
              >
                <ArrowDown aria-hidden="true" className="size-3.5" />
              </button>
            </div>
            <Tag className="w-24 justify-center">{KIND_LABELS[column.kind]}</Tag>
            <Input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={column.name}
              onChange={(e) => rename(index, e.target.value)}
              placeholder={strings.columns.namePlaceholder}
              aria-label={`Column ${index + 1} name`}
              className="h-8 flex-1"
            />
            {!column.builtin && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                aria-label={strings.columns.removeLabel}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {nameError && (
          <p role="alert" className="text-xs text-destructive">
            {strings.columns.nameRequired}
          </p>
        )}
        <Button
          id="add-column-btn"
          variant="secondary"
          size="sm"
          className="mt-1 gap-1.5 self-start"
          onClick={addCustom}
        >
          <Plus aria-hidden="true" className="size-3.5" />
          {strings.columns.add}
        </Button>
      </div>
    </AppDialog>
  );
}
