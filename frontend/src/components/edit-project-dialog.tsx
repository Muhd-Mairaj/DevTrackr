import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateProject } from "@/lib/projects";
import { strings } from "@/lib/strings";
import { useToast } from "@/lib/toast";

const updateSchema = z.object({
  name: z.string().min(1, strings.projects.nameRequired),
  description: z.string().optional(),
});

type UpdateValues = z.infer<typeof updateSchema>;

interface EditProjectDialogProps {
  project: ProjectPublic | null;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  project,
  onOpenChange,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const updateProject = useUpdateProject();

  const form = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? "",
      });
    }
  }, [project, form]);

  const onSubmit = async (values: UpdateValues) => {
    if (!project) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        body: {
          name: values.name,
          description: values.description || null,
        },
      });
      onOpenChange(false);
      toast("success", strings.projects.updatedToast);
    } catch (err) {
      form.setError("root", { message: (err as Error).message });
    }
  };

  const isSubmitting = updateProject.isPending;

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent id="edit-project-dialog">
        <DialogHeader>
          <DialogTitle>{strings.projects.updateTitle}</DialogTitle>
          <DialogDescription>
            {strings.projects.updateDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{strings.projects.nameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-project-name"
                      placeholder={strings.projects.namePlaceholder}
                      autoFocus
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{strings.projects.descriptionLabel}</FormLabel>
                  <FormControl>
                    <Input
                      id="edit-project-description"
                      placeholder={strings.projects.descriptionPlaceholder}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {strings.common.cancel}
              </Button>
              <Button
                id="edit-project-submit-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {strings.projects.updateButton}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
