import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";

interface NewEntryFabProps {
  onClick: () => void;
}

export function NewEntryFab({ onClick }: NewEntryFabProps) {
  return (
    <Button
      onClick={onClick}
      aria-label={strings.entries.newEntry}
      size="icon"
      className="fixed right-6 bottom-6 z-40 size-12 rounded-full shadow-lg sm:hidden"
    >
      <Plus className="size-5" aria-hidden="true" />
    </Button>
  );
}
