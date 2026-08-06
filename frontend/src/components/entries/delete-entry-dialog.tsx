import type { TimeEntryPublic } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { useDeleteEntry } from "@/lib/entries";

interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entry: TimeEntryPublic | null;
  /** Called after a successful delete so the page can step back. */
  onDeleted?: (entry: TimeEntryPublic) => void;
}

export function DeleteEntryDialog({
  open,
  onOpenChange,
  projectId,
  entry,
  onDeleted,
}: DeleteEntryDialogProps) {
  const { toast } = useToast();
  const deleteEntry = useDeleteEntry(projectId);

  const handleDelete = async () => {
    // Server entries always carry an id; the generated type keeps it
    // optional, so guard before passing it to the mutation.
    if (!entry?.id) return;
    try {
      await deleteEntry.mutateAsync(entry.id);
      toast("success", strings.entries.deletedToast);
      onDeleted?.(entry);
      onOpenChange(false);
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={strings.entries.deleteTitle}
      description={strings.entries.deleteDescription}
      actionLabel={strings.entries.deleteButton}
      actionVariant="destructive"
      onAction={handleDelete}
      isPending={deleteEntry.isPending}
      id="delete-entry-dialog"
    />
  );
}
