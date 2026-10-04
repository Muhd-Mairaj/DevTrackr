import { AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { strings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastActionOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  toast: (tone: ToastTone, message: string, opts?: ToastActionOptions) => void;
}

// At most 2 success toasts are shown at once; the oldest success is evicted
// to make room. Error toasts are never evicted: they carry failure feedback
// that must not be silently dropped.
const MAX_SUCCESS_TOASTS = 2;
const SUCCESS_DURATION_MS = 3000;
const ERROR_DURATION_MS = 6000;
const UNDO_DURATION_MS = 8000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (tone: ToastTone, message: string, opts?: ToastActionOptions) => {
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev.filter((t) => t.tone === "success").slice(-MAX_SUCCESS_TOASTS),
        ...prev.filter((t) => t.tone === "error"),
        {
          id,
          tone,
          message,
          actionLabel: opts?.actionLabel,
          onAction: opts?.onAction,
          // Undo/action toasts persist longer (8s) unless overridden.
          durationMs:
            opts?.durationMs ?? (opts?.onAction ? UNDO_DURATION_MS : undefined),
        },
      ]);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);
  const successToasts = toasts.filter((t) => t.tone === "success");
  const errorToasts = toasts.filter((t) => t.tone === "error");

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2"
      >
        {successToasts.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 mt-1 flex flex-col items-center gap-2"
      >
        {errorToasts.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const Icon = toast.tone === "success" ? CheckCircle2 : AlertCircle;
  const duration =
    toast.durationMs ??
    (toast.tone === "error" ? ERROR_DURATION_MS : SUCCESS_DURATION_MS);
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timeoutRef.current = window.setTimeout(onDismiss, duration);
  }, [clearTimer, onDismiss, duration]);

  // Auto-dismiss; cleanup clears the timeout on unmount.
  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [startTimer, clearTimer]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: mouse/focus handlers only pause the auto-dismiss timer; the inner button is the interactive control.
    <div
      role={toast.tone === "success" ? "status" : "alert"}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      onFocus={clearTimer}
      onBlur={startTimer}
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-md border border-edge bg-card px-3 py-2 text-sm text-foreground shadow-md",
        "animate-in slide-in-from-top-2 fade-in duration-200 motion-reduce:animate-none",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0",
          toast.tone === "success" ? "text-success" : "text-destructive",
        )}
      />
      <span>{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.onAction?.();
            onDismiss();
          }}
          className="ml-1 rounded-sm px-1.5 py-0.5 font-medium text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`${strings.common.dismiss}: ${toast.message}`}
        className="ml-1 rounded-sm p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
