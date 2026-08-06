import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectColumnItem } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
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
    if (columns.some((c) => !c.name.trim())) {
      setNameError(true);
      return;
    }
    try {
      await saveColumns.mutateAsync(columns);
      toast("success", strings.columns.savedToast);
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
      <div className="flex flex-col gap-2">
        {columns.map((column, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: staged list without stable ids; kind plus position keeps rows distinct
            key={`${column.kind}-${index}`}
            className="flex items-center gap-2 rounded-md border border-edge bg-background px-3 py-2"
          >
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={strings.columns.moveUp}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={strings.columns.moveDown}
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
              onChange={(e) => rename(index, e.target.value)}
              placeholder={strings.columns.namePlaceholder}
              aria-label={strings.columns.namePlaceholder}
              className="flex-1"
            />
            {!column.builtin && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                aria-label={strings.columns.removeLabel}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {nameError && (
          <p className="text-xs text-destructive">
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
          <Plus className="size-3.5" />
          {strings.columns.add}
        </Button>
      </div>
    </AppDialog>
  );
}
