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

export function DayStamp({ date, className }: DayStampProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {formatDayStamp(date)}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
