import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border border-input bg-[#fbf8ef] px-3 py-2 text-base text-foreground shadow-[inset_0_1px_2px_rgb(18_37_29/6%)] transition-colors file:mr-3 file:border-0 file:bg-transparent file:py-1 file:font-mono file:text-xs file:uppercase file:tracking-[0.12em] file:text-foreground placeholder:text-muted-foreground/70 hover:border-ink/50 focus-visible:border-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
