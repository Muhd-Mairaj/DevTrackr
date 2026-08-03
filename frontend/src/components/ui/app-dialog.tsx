import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/lib/strings";

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  cancelLabel?: string;
  actionLabel: string;
  actionVariant?: "default" | "destructive";
  onAction?: () => void;
  actionDisabled?: boolean;
  isPending?: boolean;
  id?: string;
  formId?: string;
  actionButtonId?: string;
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = strings.common.cancel,
  actionLabel,
  actionVariant = "default",
  onAction,
  actionDisabled = false,
  isPending = false,
  id,
  formId,
  actionButtonId,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id={id}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            id={actionButtonId}
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onAction}
            variant={actionVariant}
            disabled={actionDisabled || isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
