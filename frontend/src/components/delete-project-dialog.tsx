import type { ProjectPublic } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
import { useDeleteProject } from "@/lib/projects";
import { strings } from "@/lib/strings";
import { useToast } from "@/lib/toast";

interface DeleteProjectDialogProps {
  project: ProjectPublic | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  project,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const { toast } = useToast();
  const deleteProject = useDeleteProject();

  const confirm = async () => {
    if (!project) return;
    await deleteProject.mutateAsync(project.id);
    onOpenChange(false);
    toast("success", strings.projects.deletedToast);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) deleteProject.reset();
    onOpenChange(open);
  };

  return (
    <AppDialog
      open={project !== null}
      onOpenChange={handleOpenChange}
      title={strings.projects.deleteTitle}
      description={strings.projects.deleteDescription}
      actionLabel={strings.projects.deleteButton}
      actionVariant="destructive"
      onAction={confirm}
      isPending={deleteProject.isPending}
      id="delete-project-dialog"
      actionButtonId="delete-project-confirm-btn"
    >
      {deleteProject.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {(deleteProject.error as Error)?.message}
        </p>
      )}
    </AppDialog>
  );
}
