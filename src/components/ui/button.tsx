import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap border text-[0.8125rem] font-semibold tracking-[0.01em] transition-[background-color,color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/12%),0_1px_0_rgb(18_37_29/18%)] hover:bg-ink/90",
        accent:
          "border-transparent bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/18%),0_1px_0_rgb(18_37_29/20%)] hover:bg-[#a93623]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-ink/35 bg-transparent text-foreground hover:border-ink hover:bg-ink/[0.06]",
        secondary: "border-ink/15 bg-secondary text-secondary-foreground hover:bg-[#cfd8ca]",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-ink/[0.06]",
        link: "border-transparent bg-transparent p-0 text-foreground underline decoration-accent decoration-1 underline-offset-4 hover:decoration-2",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
