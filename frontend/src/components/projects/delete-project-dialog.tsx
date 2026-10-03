import { useEffect, useState } from "react";
import type { ProjectPublic } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { useUndoDeleteProject } from "@/lib/projects";

interface DeleteProjectDialogProps {
  project: ProjectPublic | null;
  onOpenChange: (open: boolean) => void;
  /** Known entry count for this project; unknown renders a generic warning. */
  entryCount?: number;
}

export function DeleteProjectDialog({
  project,
  onOpenChange,
  entryCount,
}: DeleteProjectDialogProps) {
  const { toast } = useToast();
  const { remove, undo, isPending, isError, error, reset } =
    useUndoDeleteProject();
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (project === null) setConfirmText("");
  }, [project]);

  const confirmed = project !== null && confirmText.trim() === project.name;

  const confirm = async () => {
    if (!project || !confirmed) return;
    try {
      await remove(project);
      onOpenChange(false);
      setConfirmText("");
      toast("success", strings.projects.deletedToast, {
        actionLabel: strings.common.undo,
        durationMs: 8000,
        onAction: () => {
          void undo()
            .then(() => toast("success", strings.projects.createdToast))
            .catch((err) => toast("error", (err as Error).message));
        },
      });
    } catch (err) {
      toast("error", (err as Error).message);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setConfirmText("");
    }
    onOpenChange(open);
  };

  return (
    <AppDialog
      open={project !== null}
      onOpenChange={handleOpenChange}
      title={strings.projects.deleteTitle}
      description={
        project
          ? strings.projects.deleteDescriptionWith(project.name, entryCount)
          : strings.projects.deleteDescription
      }
      actionLabel={strings.projects.deleteButton}
      actionVariant="destructive"
      onAction={confirm}
      actionDisabled={!confirmed}
      isPending={isPending}
      id="delete-project-dialog"
      actionButtonId="delete-project-confirm-btn"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="delete-project-confirm-input"
          className="text-sm text-muted-foreground"
        >
          {strings.projects.typeToConfirm}
        </label>
        <Input
          id="delete-project-confirm-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={
            project
              ? strings.projects.typeToConfirmPlaceholder(project.name)
              : ""
          }
          autoComplete="off"
        />
      </div>
      {isError && <ErrorBanner message={(error as Error)?.message} />}
    </AppDialog>
  );
}
