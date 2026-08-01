import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import type { ProjectPublic } from "@/client/types.gen";
import { AppDialog } from "@/components/ui/app-dialog";
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
    <AppDialog
      open={project !== null}
      onOpenChange={onOpenChange}
      title={strings.projects.updateTitle}
      description={strings.projects.updateDescription}
      actionLabel={strings.projects.updateButton}
      isPending={isSubmitting}
      formId="edit-project-form"
      id="edit-project-dialog"
      actionButtonId="edit-project-submit-btn"
    >
      <Form {...form}>
        <form
          id="edit-project-form"
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
        </form>
      </Form>
    </AppDialog>
  );
}
