import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  toast: (tone: ToastTone, message: string) => void;
}

// At most 2 success toasts are shown at once; the oldest success is evicted
// to make room. Error toasts are never evicted: they carry failure feedback
// that must not be silently dropped.
const MAX_SUCCESS_TOASTS = 2;
const SUCCESS_DURATION_MS = 3000;
const ERROR_DURATION_MS = 6000;

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
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev.filter((t) => t.tone === "success").slice(-MAX_SUCCESS_TOASTS),
        ...prev.filter((t) => t.tone === "error"),
        { id, tone, message },
      ]);
      window.setTimeout(
        () => dismiss(id),
        tone === "error" ? ERROR_DURATION_MS : SUCCESS_DURATION_MS,
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2"
      >
        {toasts.map((t) => (
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
  return (
    <button
      type="button"
      onClick={onDismiss}
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-md border border-edge bg-card px-3 py-2 text-sm text-foreground shadow-md",
        "animate-in slide-in-from-top-2 fade-in duration-200 motion-reduce:animate-none",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          toast.tone === "success" ? "text-success" : "text-destructive",
        )}
      />
      <span>{toast.message}</span>
    </button>
  );
}
