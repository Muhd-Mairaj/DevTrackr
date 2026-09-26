import type { TimeEntryPublic } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import {
  entryToRecreatePayload,
  useCreateEntry,
  useDeleteEntry,
} from "@/lib/entries";
import { formatDate, formatDuration } from "@/lib/utils";

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
  const createEntry = useCreateEntry(projectId);

  const entryName = entry?.description?.trim() || strings.entries.untitledEntry;
  const description = entry
    ? `${strings.entries.deleteDescriptionWith(entryName, formatDate(entry.start_time))}${
        entry.duration_seconds !== null && entry.duration_seconds !== undefined
          ? ` ${strings.entries.deleteDurationWith(formatDuration(entry.duration_seconds))}`
          : ""
      }`
    : strings.entries.deleteDescription;

  const handleDelete = async () => {
    // Server entries always carry an id; the generated type keeps it
    // optional, so guard before passing it to the mutation.
    if (!entry?.id) return;
    const snapshot = entry;
    try {
      await deleteEntry.mutateAsync(entry.id);
      toast("success", strings.entries.deletedToast, {
        actionLabel: strings.common.undo,
        durationMs: 8000,
        onAction: () => {
          createEntry.mutate(entryToRecreatePayload(snapshot), {
            onSuccess: () => toast("success", strings.entries.createdToast),
            onError: (err) => toast("error", (err as Error).message),
          });
        },
      });
      onDeleted?.(entry);
      onOpenChange(false);
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) deleteEntry.reset();
    onOpenChange(open);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={strings.entries.deleteTitle}
      description={description}
      actionLabel={strings.entries.deleteButton}
      actionVariant="destructive"
      onAction={handleDelete}
      isPending={deleteEntry.isPending}
      id="delete-entry-dialog"
    >
      {deleteEntry.isError && (
        <ErrorBanner message={(deleteEntry.error as Error)?.message} />
      )}
    </AppDialog>
  );
}
