import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { strings } from "@/i18n/strings";

interface NewEntryFabProps {
  onClick: () => void;
}

export function NewEntryFab({ onClick }: NewEntryFabProps) {
  return (
    <Button
      id="new-entry-fab"
      onClick={onClick}
      aria-label={strings.entries.newEntry}
      size="icon"
      className="fixed right-6 bottom-6 z-40 size-12 rounded shadow-[0_2px_0_0_var(--border)] sm:hidden"
    >
      <Plus className="size-5" aria-hidden="true" />
    </Button>
  );
}
