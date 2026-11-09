import { cn } from "@/lib/utils";

/**
 * Instrument rule: a hairline with ticks dropping every 16px. The signature
 * section divider of the Signal identity.
 */
export function TickRule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("tick-rule", className)} />;
}
