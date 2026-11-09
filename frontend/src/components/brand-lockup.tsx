import { LogoMark } from "@/components/logo-mark";
import { strings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

/**
 * Brand lockup: the daybook mark plus the wordmark. Presentational; wrap it in
 * a Link where it navigates.
 */
export function BrandLockup({
  size = 26,
  className,
  wordmarkClassName,
  showMark = true,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {showMark && <LogoMark size={size} />}
      <span
        className={cn(
          "font-display text-[15px] font-bold tracking-[-0.02em]",
          wordmarkClassName,
        )}
      >
        {strings.common.brand}
      </span>
    </span>
  );
}
