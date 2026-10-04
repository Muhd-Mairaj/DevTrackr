import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { strings } from "@/i18n/strings";
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
  const numbers = useMemo(
    () => pageNumbers(page, pageCount),
    [page, pageCount],
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <span className="flex items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">
        <span>{strings.entries.pageRange(start, end, total)}</span>
        <span aria-hidden="true">·</span>
        <span>{strings.entries.pageXOfY(page, pageCount)}</span>
      </span>
      <nav
        className="flex items-center gap-1"
        aria-label={strings.entries.pagesNav}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label={strings.entries.firstPage}
          className="h-11 w-11 sm:h-8 sm:w-8"
        >
          <ChevronsLeft aria-hidden="true" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={strings.entries.previousPage}
          className="h-11 w-11 sm:h-8 sm:w-8"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        {numbers.map((n, i) =>
          n === "…" ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static ellipsis list
              key={`ellipsis-${i}`}
              className="px-1 font-mono text-xs text-muted-foreground"
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
                "font-mono text-xs tabular-nums",
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
          className="h-11 w-11 sm:h-8 sm:w-8"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label={strings.entries.lastPage}
          className="h-11 w-11 sm:h-8 sm:w-8"
        >
          <ChevronsRight aria-hidden="true" className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
