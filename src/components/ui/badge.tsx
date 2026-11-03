import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/50 bg-destructive/10 text-destructive",
        outline: "border-ink/40 bg-transparent text-foreground",
        valid: "border-valid/50 bg-valid/10 text-valid",
        accent: "border-accent/50 bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
