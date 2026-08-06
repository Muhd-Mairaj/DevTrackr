import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import type { TimeEntryPublic } from "@/client/types.gen";
import { DateTimeInput } from "@/components/entries/date-time-input";
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
import { useCreateEntry, useUpdateEntry } from "@/lib/entries";

const entrySchema = z
  .object({
    description: z.string().min(1, strings.entries.descriptionRequired),
    start: z.string().min(1, strings.entries.startRequired),
    end: z.string().optional(),
  })
  .refine((v) => !v.end || new Date(v.end) > new Date(v.start), {
    message: strings.entries.endAfterStart,
    path: ["end"],
  });

type EntryValues = z.infer<typeof entrySchema>;

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// New entries start at the current moment, floored to the nearest five
// minutes so the logbook reads cleanly.
function floorToFiveMinutes(d: Date): Date {
  const minutes = d.getMinutes();
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    minutes - (minutes % 5),
  );
}

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entry: TimeEntryPublic | null;
  /** Called after a successful create so the page can jump to page 1. */
  onCreated?: () => void;
}

export function EntryFormDialog({
  open,
  onOpenChange,
  projectId,
  entry,
  onCreated,
}: EntryFormDialogProps) {
  const { toast } = useToast();
  const createEntry = useCreateEntry(projectId);
  const updateEntry = useUpdateEntry(projectId);
  const isEdit = entry !== null;
  const mutation = isEdit ? updateEntry : createEntry;

  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { description: "", start: "", end: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: entry?.description ?? "",
        start: entry
          ? toLocalInput(entry.start_time)
          : toLocalInput(floorToFiveMinutes(new Date()).toISOString()),
        end: entry?.end_time ? toLocalInput(entry.end_time) : "",
      });
    }
  }, [open, entry, form]);

  const onSubmit = async (values: EntryValues) => {
    try {
      const body = {
        description: values.description,
        start_time: new Date(values.start).toISOString(),
        end_time: values.end ? new Date(values.end).toISOString() : null,
      };
      if (isEdit && entry) {
        // Server entries always carry an id; the generated type keeps it
        // optional, so guard before passing it to the mutation.
        if (!entry.id) return;
        await updateEntry.mutateAsync({ id: entry.id, body });
        toast("success", strings.entries.updatedToast);
      } else {
        await createEntry.mutateAsync(body);
        toast("success", strings.entries.createdToast);
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      form.setError("root", { message: (err as Error).message });
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? strings.entries.updateTitle : strings.entries.createTitle}
      description={
        isEdit
          ? strings.entries.updateDescription
          : strings.entries.createDescription
      }
      actionLabel={
        isEdit ? strings.entries.updateButton : strings.entries.createButton
      }
      isPending={mutation.isPending}
      formId="entry-form"
      actionButtonId="entry-form-submit-btn"
    >
      <Form {...form}>
        <form
          id="entry-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-w-0 flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{strings.entries.descriptionLabel}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={strings.entries.descriptionPlaceholder}
                    autoFocus
                    disabled={mutation.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{strings.entries.startLabel}</FormLabel>
                  <DateTimeInput
                    value={field.value}
                    onChange={field.onChange}
                    dateLabel={strings.entries.startDateLabel}
                    timeLabel={strings.entries.startTimeLabel}
                    disabled={mutation.isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{strings.entries.endLabel}</FormLabel>
                  <DateTimeInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    dateLabel={strings.entries.endDateLabel}
                    timeLabel={strings.entries.endTimeLabel}
                    disabled={mutation.isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              {strings.entries.rangeHint}
            </p>
          </div>
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
