import { zodResolver } from "@hookform/resolvers/zod";
import { Pause } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import type { TimeEntryPublic } from "@/client/types.gen";
import { DateTimeInput } from "@/components/entries/date-time-input";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
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
import { useCreateEntry, useUpdateEntry } from "@/lib/entries";
import {
  formatDuration,
  formatDurationInput,
  parseDurationInput,
} from "@/lib/utils";

const entrySchema = z
  .object({
    description: z.string().min(1, strings.entries.descriptionRequired),
    start: z.string().min(1, strings.entries.startRequired),
    end: z.string().optional(),
    duration: z.string().optional(),
  })
  .refine((v) => !v.end || new Date(v.end) > new Date(v.start), {
    message: strings.entries.endAfterStart,
    path: ["end"],
  });

type EntryValues = z.infer<typeof entrySchema>;

export interface ExistingEntryRange {
  id?: string;
  start_time: string;
  end_time?: string | null;
}

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

function rangeMinutes(start: string, end: string): number | null {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.round(ms / 60000);
}

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entry: TimeEntryPublic | null;
  /** Called after a successful create so the page can jump to page 1. */
  onCreated?: () => void;
  /** Recent descriptions offered as autocomplete suggestions. */
  recentDescriptions?: string[];
  /** Entries on the current page, used for a non-blocking overlap hint. */
  existingEntries?: ExistingEntryRange[];
}

export function EntryFormDialog({
  open,
  onOpenChange,
  projectId,
  entry,
  onCreated,
  recentDescriptions = [],
  existingEntries = [],
}: EntryFormDialogProps) {
  const { toast } = useToast();
  const createEntry = useCreateEntry(projectId);
  const updateEntry = useUpdateEntry(projectId);
  const isEdit = entry !== null;
  const mutation = isEdit ? updateEntry : createEntry;
  // While the duration field has focus, typed text (e.g. a partial "1:")
  // must not be overwritten by the start/end sync below.
  const durationFocused = useRef(false);

  const form = useForm<EntryValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      description: "",
      start: "",
      end: "",
      duration: "",
    },
  });

  useEffect(() => {
    if (open) {
      const start = entry
        ? toLocalInput(entry.start_time)
        : toLocalInput(floorToFiveMinutes(new Date()).toISOString());
      const end = entry?.end_time ? toLocalInput(entry.end_time) : "";
      const minutes = start && end ? rangeMinutes(start, end) : null;
      form.reset({
        description: entry?.description ?? "",
        start,
        end,
        duration: minutes !== null ? formatDurationInput(minutes) : "",
      });
    }
  }, [open, entry, form]);

  const startValue = form.watch("start");
  const endValue = form.watch("end");

  // Editing end updates the duration text (unless it is being typed in).
  useEffect(() => {
    if (durationFocused.current) return;
    if (!startValue || !endValue) return;
    const minutes = rangeMinutes(startValue, endValue);
    if (minutes === null) return;
    const next = formatDurationInput(minutes);
    if (form.getValues("duration") !== next) {
      form.setValue("duration", next, { shouldValidate: false });
    }
  }, [startValue, endValue, form]);

  const liveDuration = useMemo(() => {
    if (!startValue) return null;
    // An empty end means the entry is still running: preview start → now.
    const endMs = endValue ? new Date(endValue).getTime() : Date.now();
    const ms = endMs - new Date(startValue).getTime();
    if (Number.isNaN(ms) || ms <= 0) return null;
    return formatDuration(Math.floor(ms / 1000));
  }, [startValue, endValue]);

  const overlaps = useMemo(() => {
    if (!startValue) return false;
    const startMs = new Date(startValue).getTime();
    if (Number.isNaN(startMs)) return false;
    // A running entry (empty end) occupies start → now for the hint.
    const endMs = endValue ? new Date(endValue).getTime() : Date.now();
    if (Number.isNaN(endMs) || endMs <= startMs) return false;
    return existingEntries.some((e) => {
      if (entry?.id && e.id === entry.id) return false;
      const s = new Date(e.start_time).getTime();
      if (Number.isNaN(s)) return false;
      const en = e.end_time
        ? new Date(e.end_time).getTime()
        : Number.POSITIVE_INFINITY;
      if (Number.isNaN(en)) return false;
      return startMs < en && endMs > s;
    });
  }, [startValue, endValue, existingEntries, entry?.id]);

  const handleNow = () => {
    form.setValue(
      "start",
      toLocalInput(floorToFiveMinutes(new Date()).toISOString()),
      { shouldValidate: true },
    );
  };

  // Editing the duration shifts the end to preserve the start.
  const handleDurationChange = (
    raw: string,
    onChange: (value: string) => void,
  ) => {
    onChange(raw);
    if (!startValue) return;
    const minutes = parseDurationInput(raw);
    if (minutes === null) return;
    const startMs = new Date(startValue).getTime();
    if (Number.isNaN(startMs)) return;
    form.setValue(
      "end",
      toLocalInput(new Date(startMs + minutes * 60000).toISOString()),
      { shouldValidate: true },
    );
  };

  // Pausing an entry only offered when editing an entry that is currently running
  const isRunningEdit = isEdit && entry?.end_time == null && !endValue;
  const handlePause = () => {
    form.setValue("end", toLocalInput(new Date().toISOString()), {
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: EntryValues) => {
    try {
      const body = {
        description: values.description,
        start_time: new Date(values.start).toISOString(),
        // An empty end keeps the entry running (end_time: null).
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
                    disabled={mutation.isPending}
                    list="recent-descriptions"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <datalist
                  id="recent-descriptions"
                  aria-label={strings.entries.recentLabel}
                >
                  {recentDescriptions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
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
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{strings.entries.startLabel}</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleNow}
                      disabled={mutation.isPending}
                    >
                      {strings.entries.nowButton}
                    </Button>
                  </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{strings.entries.endLabel}</FormLabel>
                    {isRunningEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handlePause}
                        disabled={mutation.isPending}
                        title={strings.entries.pauseTitle}
                        className="gap-1 border-amber-500/50 bg-amber-500/10 font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <Pause className="size-3.5" aria-hidden="true" />
                        {strings.entries.pauseButton}
                      </Button>
                    )}
                  </div>
                  {isRunningEdit && (
                    <p
                      role="note"
                      className="text-xs text-amber-700 dark:text-amber-400"
                    >
                      {strings.entries.runningEditHint}
                    </p>
                  )}
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
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{strings.entries.durationLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={strings.entries.durationPlaceholder}
                      disabled={mutation.isPending}
                      inputMode="decimal"
                      autoComplete="off"
                      {...field}
                      onFocus={() => {
                        durationFocused.current = true;
                      }}
                      onBlur={() => {
                        durationFocused.current = false;
                        field.onBlur();
                      }}
                      onChange={(e) =>
                        handleDurationChange(e.target.value, field.onChange)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {strings.entries.rangeHint}
              {liveDuration ? ` ${liveDuration}` : ""}
            </p>
            {overlaps && (
              <p role="note" className="text-xs text-amber-600">
                {strings.entries.overlapWarning}
              </p>
            )}
          </div>
          {form.formState.errors.root && (
            <ErrorBanner message={form.formState.errors.root.message} />
          )}
        </form>
      </Form>
    </AppDialog>
  );
}
