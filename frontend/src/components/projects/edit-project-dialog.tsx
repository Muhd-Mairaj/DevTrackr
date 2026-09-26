import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import type { ProjectPublic, ProjectUpdate } from "@/client/types.gen";
import { RepositorySelector } from "@/components/projects/repository-selector";
import { AppDialog } from "@/components/ui/app-dialog";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { useUpdateProject } from "@/lib/projects";

const updateSchema = z.object({
  name: z.string().min(1, strings.projects.nameRequired),
  description: z.string().optional(),
  // No .default(): a default would make z.input optional while z.output is
  // required, which breaks useForm's Resolver<F, any, F> type. defaultValues
  // in useForm already provides the empty array.
  repositoryIds: z.array(z.number()),
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
    defaultValues: { name: "", description: "", repositoryIds: [] },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? "",
        repositoryIds: (project.repositories ?? []).map((r) => r.github_id),
      });
    }
  }, [project, form]);

  const onSubmit = async (values: UpdateValues) => {
    if (!project) return;
    try {
      const body: ProjectUpdate = {
        name: values.name,
        description: values.description || null,
      };
      // Only include repository_ids when the project's repos were loaded,
      // otherwise the backend's full-set-replace would clear all links.
      // An absent field leaves links unchanged.
      if (project.repositories !== undefined) {
        body.repository_ids = values.repositoryIds;
      }
      await updateProject.mutateAsync({
        id: project.id,
        body,
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
          className="flex min-w-0 flex-col gap-4"
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
                  <textarea
                    id="edit-project-description"
                    placeholder={strings.projects.descriptionPlaceholder}
                    disabled={isSubmitting}
                    rows={3}
                    className="min-h-20 w-full min-w-0 rounded-md border border-edge bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repositoryIds"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RepositorySelector
                    selected={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <ErrorBanner message={form.formState.errors.root.message} />
          )}
        </form>
      </Form>
    </AppDialog>
  );
}
