import { useEffect, useState } from "react";
import { UtilsService } from "@/client";
import { StatusChip } from "@/components/status-chip";
import { strings } from "@/i18n/strings";

type PingResponse = {
  status?: string;
  message?: string;
};

export function PingStatus() {
  const [data, setData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    UtilsService.ping()
      .then((res: { data?: PingResponse }) => {
        if (res.data) {
          setData(res.data);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : strings.ping.fetchError);
      });
  }, []);

  if (error) {
    return (
      <div
        data-testid="ping-error"
        role="alert"
        className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-sm border border-destructive/35 bg-destructive/10 px-2 py-1 font-mono text-[11px] font-medium text-destructive tabular-nums"
      >
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-destructive"
        />
        <span className="truncate">{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        data-testid="ping-loading"
        role="status"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm border border-border bg-muted px-2 py-1"
      >
        <span
          aria-hidden="true"
          className="live-pulse size-1.5 shrink-0 rounded-full bg-muted-foreground"
        />
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {strings.ping.loading}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="ping-container"
      className="flex flex-wrap items-center gap-2"
    >
      <StatusChip data-testid="ping-status" tone="success">
        {data.status}
      </StatusChip>
      <span
        data-testid="ping-message"
        className="font-mono text-xs text-muted-foreground tabular-nums"
      >
        {data.message}
      </span>
    </div>
  );
}
