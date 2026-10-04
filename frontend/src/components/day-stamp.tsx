import { cn } from "@/lib/utils";

interface DayStampProps {
  date: Date;
  className?: string;
}

// Fallback labels when Intl is unavailable (e.g. minimal test runtimes).
const FALLBACK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const FALLBACK_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function formatDayStamp(date: Date): string {
  try {
    const locale =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en";
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(date)
      .toUpperCase();
    const month = new Intl.DateTimeFormat(locale, { month: "short" })
      .format(date)
      .toUpperCase();
    return `${weekday} · ${date.getDate()} ${month} ${date.getFullYear()}`;
  } catch {
    return `${FALLBACK_DAYS[date.getDay()]} · ${date.getDate()} ${FALLBACK_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
}

/**
 * The dateline that opens every page: a mono date and a ruled hairline running
 * to the edge. The "ruled paper" motif of the Daybook identity.
 */
export function DayStamp({ date, className }: DayStampProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase whitespace-nowrap">
        {formatDayStamp(date)}
      </span>
      <span aria-hidden="true" className="rule min-w-0 flex-1" />
    </div>
  );
}
