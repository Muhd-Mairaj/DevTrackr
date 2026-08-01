import { Loader2 } from "lucide-react";
import type { ProjectPublic } from "@/client/types.gen";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    try {
      await deleteProject.mutateAsync(project.id);
      onOpenChange(false);
      toast("success", strings.projects.deletedToast);
    } catch (err) {
      onOpenChange(false);
      toast("error", (err as Error).message);
    }
  };

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent id="delete-project-dialog">
        <DialogHeader>
          <DialogTitle>{strings.projects.deleteTitle}</DialogTitle>
          <DialogDescription>
            {strings.projects.deleteDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={deleteProject.isPending}
          >
            {strings.common.cancel}
          </Button>
          <Button
            id="delete-project-confirm-btn"
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {strings.projects.deleteButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
