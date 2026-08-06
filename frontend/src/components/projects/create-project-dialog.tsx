import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { RepositorySelector } from "@/components/projects/repository-selector";
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
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { useCreateProject } from "@/lib/projects";

const createSchema = z.object({
  name: z.string().min(1, strings.projects.nameRequired),
  description: z.string().optional(),
  // No .default(): a default would make z.input optional while z.output is
  // required, which breaks useForm's Resolver<F, any, F> type. defaultValues
  // in useForm already provides the empty array.
  repositoryIds: z.array(z.number()),
});

type CreateValues = z.infer<typeof createSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const createProject = useCreateProject();

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", repositoryIds: [] },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", description: "", repositoryIds: [] });
    }
  }, [open, form]);

  const onSubmit = async (values: CreateValues) => {
    try {
      await createProject.mutateAsync({
        name: values.name,
        description: values.description || null,
        repository_ids: values.repositoryIds,
      });
      onOpenChange(false);
      toast("success", strings.projects.createdToast);
    } catch (err) {
      form.setError("root", { message: (err as Error).message });
    }
  };

  const isSubmitting = createProject.isPending;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={strings.projects.createTitle}
      description={strings.projects.createDescription}
      actionLabel={strings.projects.createButton}
      isPending={isSubmitting}
      formId="create-project-form"
      id="create-project-dialog"
      actionButtonId="create-project-submit-btn"
    >
      <Form {...form}>
        <form
          id="create-project-form"
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
                    id="project-name"
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
                    id="project-description"
                    placeholder={strings.projects.descriptionPlaceholder}
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
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </form>
      </Form>
    </AppDialog>
  );
}
