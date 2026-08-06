import { Input } from "@/components/ui/input";

interface DateTimeInputProps {
  /** Local datetime as "YYYY-MM-DDTHH:mm", a bare date when the time is
   * unset (midnight), or "" when nothing is set. */
  value: string;
  onChange: (value: string) => void;
  dateLabel: string;
  timeLabel: string;
  disabled?: boolean;
}

export function DateTimeInput({
  value,
  onChange,
  dateLabel,
  timeLabel,
  disabled,
}: DateTimeInputProps) {
  const [date, time] = value.split("T");

  return (
    <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
      <Input
        type="date"
        aria-label={dateLabel}
        value={date ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const nextDate = e.target.value;
          onChange(nextDate ? (time ? `${nextDate}T${time}` : nextDate) : "");
        }}
      />
      <Input
        type="time"
        aria-label={timeLabel}
        value={time ?? ""}
        disabled={disabled}
        onChange={(e) => {
          onChange(date ? `${date}T${e.target.value}` : "");
        }}
      />
    </div>
  );
}
