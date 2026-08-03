import { Separator } from "@/components/ui/separator";

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <Separator className={className} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-muted-foreground text-xs">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}
