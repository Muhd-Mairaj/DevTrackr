import type * as React from "react";

import { cn } from "@/lib/utils";

// Same control shell as Input: leaf fill, hairline outline, soft lip, accent
// selection and the focus ring. Rows drive the height.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded border border-edge bg-card px-3 py-2 text-sm shadow-2xs transition-[color,border-color] outline-none selection:bg-signal/25 selection:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
