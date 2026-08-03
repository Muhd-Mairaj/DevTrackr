import { cn } from "@/lib/utils";

interface DayStampProps {
  date: Date;
  className?: string;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
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

export function DayStamp({ date, className }: DayStampProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {DAYS[date.getDay()]} · {date.getDate()} {MONTHS[date.getMonth()]}{" "}
        {date.getFullYear()}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
