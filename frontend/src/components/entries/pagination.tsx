import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";
import { PAGE_SIZE } from "@/lib/entries";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

function pageNumbers(current: number, count: number): (number | "…")[] {
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  const first = 1;
  const last = count;
  if (current <= 4) return [first, 2, 3, 4, 5, "…", last];
  if (current >= count - 3)
    return [first, "…", count - 4, count - 3, count - 2, count - 1, last];
  return [first, "…", current - 1, current, current + 1, "…", last];
}

export function Pagination({
  page,
  pageCount,
  total,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {strings.entries.pageRange(start, end, total)}
      </span>
      <nav
        className="flex items-center gap-1"
        aria-label={strings.entries.pagesNav}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={strings.entries.previousPage}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pageNumbers(page, pageCount).map((n, i) =>
          n === "…" ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static ellipsis list
              key={i}
              className="px-1 font-mono text-[11px] text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={n}
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange(n)}
              className={cn(
                "font-mono text-[11px] tabular-nums",
                n === page && "font-semibold text-foreground",
              )}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={strings.entries.nextPage}
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
