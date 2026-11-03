import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      aria-label="QuickCert home"
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center border border-ink bg-ink text-primary-foreground">
        <span className="font-display text-[0.95rem] font-semibold leading-none tracking-tight">
          QC
        </span>
        <span
          aria-hidden
          className="absolute -right-px -top-px h-2 w-2 bg-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-foreground">
            QuickCert
          </span>
          <span className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.24em] text-muted-foreground">
            Certificate registry
          </span>
        </span>
      )}
    </Link>
  );
}
