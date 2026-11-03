import type { ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-ink/20">
      <div className="mx-auto max-w-[1240px] px-6 pb-12 pt-14 md:pb-16 md:pt-20">
        <p className="micro flex items-center gap-3 text-muted-foreground">
          <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
          {title}
        </h1>
        {lede && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{lede}</p>
        )}
        {children}
      </div>
    </section>
  );
}

export function Section({
  children,
  className,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  tone?: "paper" | "card" | "ink";
}) {
  return (
    <section
      className={[
        "border-b border-ink/15",
        tone === "card" ? "bg-card" : tone === "ink" ? "bg-ink text-primary-foreground" : "",
        className ?? "",
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1240px] px-6 py-14 md:py-20">{children}</div>
    </section>
  );
}
