import type * as React from "react";

import { cn } from "@/lib/utils";

// The default surface of the Daybook identity: a leaf card on the paper canvas,
// a hairline rule, and soft elevation. Compose with PanelHeader / PanelBody.
function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xs",
        className,
      )}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        "font-mono text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function PanelMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="panel-meta"
      className={cn(
        "font-mono text-[11px] tracking-[0.04em] text-muted-foreground tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="panel-body" className={cn("p-5", className)} {...props} />
  );
}

function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-footer"
      className={cn(
        "flex items-center border-t border-border px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelMeta,
  PanelBody,
  PanelFooter,
};
