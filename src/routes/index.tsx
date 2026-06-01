import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { ArrowRight, MousePointer2, Sparkles, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickCert — Design and bulk-generate certificates" },
      {
        name: "description",
        content:
          "Visually design certificate templates with placeholders, then generate single PNGs or bulk batches from CSV/Excel.",
      },
      { property: "og:title", content: "QuickCert" },
      {
        property: "og:description",
        content: "Design, populate, and bulk-generate certificate PNGs.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-radial-glow" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Pixel-aligned certificate generation
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Design once.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-glow to-primary bg-clip-text text-transparent">
              Generate thousands.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            QuickCert is a visual editor for certificate templates. Drag in
            placeholders, upload a CSV, and ship a ZIP of finished PNGs in
            seconds.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_-12px_var(--primary)] transition hover:bg-primary/90"
            >
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-md border border-border bg-surface/40 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t border-border/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            A three-step pipeline
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Built around your FastAPI backend's normalized coordinate contract,
            so the canvas preview matches generated PNGs exactly.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "01 — Upload background",
                desc: "Drop a PNG. The template dimensions are read on the server and locked in.",
              },
              {
                icon: MousePointer2,
                title: "02 — Place elements",
                desc: "Static text, image overlays, and {placeholders} you fill at generation time.",
              },
              {
                icon: FileSpreadsheet,
                title: "03 — Generate",
                desc: "One certificate from a form, or hundreds from a CSV/XLSX as a ZIP.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/70 bg-card p-6 transition hover:border-primary/40"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
          QuickCert · Connected to{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
            {import.meta.env.VITE_API_BASE ?? "http://localhost:8000"}
          </code>
        </div>
      </footer>
    </div>
  );
}
