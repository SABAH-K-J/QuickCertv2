import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  Lock,
  QrCode,
  ScanLine,
  Sparkles,
  Type,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SpecimenCertificate } from "@/components/site/SpecimenCertificate";
import { VerificationForm } from "@/components/site/VerificationForm";
import { FaqJsonLd, FaqList, InlineFaqLink } from "@/components/site/FaqList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_DESCRIPTION, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: "QuickCert — Design once, issue certificates at any scale",
      description: SITE_DESCRIPTION,
      path: "/",
      jsonLd: [
        {
          "@type": "WebSite",
          name: "QuickCert",
          description: SITE_DESCRIPTION,
          url: "/",
        },
        {
          "@type": "SoftwareApplication",
          name: "QuickCert",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "A free, open-source certificate template editor and bulk generator. Design a template, fill placeholders from CSV or XLSX, and download a ZIP of PNG certificates.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          license: "https://opensource.org/licenses/MIT",
          featureList: [
            "Visual certificate template editor",
            "CSV and XLSX bulk generation",
            "Up to 500 certificates per batch",
            "Optional QR verification",
            "Private templates",
            "No watermark",
          ],
        },
        FaqJsonLd(),
      ],
    }),
  component: Landing,
});

const workflow = [
  {
    n: "01",
    title: "Design the template",
    body: "Upload the certificate background you already have. Place text and images exactly where they belong.",
    icon: ImageIcon,
  },
  {
    n: "02",
    title: "Mark the fields",
    body: "Drop in {name}, {date}, {course}, or your own custom placeholder. Static text stays put.",
    icon: Type,
  },
  {
    n: "03",
    title: "Load the rows",
    body: "Upload a CSV or XLSX whose columns match your placeholders. Check the first row before you commit.",
    icon: FileSpreadsheet,
  },
  {
    n: "04",
    title: "Issue the batch",
    body: "Download a ZIP with one PNG per row. Add optional QR codes so every certificate can be verified.",
    icon: QrCode,
  },
];

function Landing() {
  const [recipient, setRecipient] = useState("Amara Diallo");
  const [course, setCourse] = useState("Workshop Facilitation");
  const [date, setDate] = useState("14 June 2026");
  const [serial, setSerial] = useState("QC-7F3A-2026");

  function randomise() {
    const names = ["Amara Diallo", "Jonas Weber", "Priya Raman", "Luis Ferreira", "Mei Tan"];
    const courses = [
      "Workshop Facilitation",
      "Community First Aid",
      "Data Literacy",
      "Volunteer Coordination",
      "Public Speaking",
    ];
    setRecipient(names[Math.floor(Math.random() * names.length)]);
    setCourse(courses[Math.floor(Math.random() * courses.length)]);
    setSerial(`QC-${Math.random().toString(16).slice(2, 6).toUpperCase()}-2026`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />

      <main id="main" className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-ink/25">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-[0.07] guilloche" />
            <div className="absolute -bottom-32 left-1/4 h-[360px] w-[360px] rounded-full opacity-[0.05] guilloche" />
          </div>

          <div className="relative mx-auto grid max-w-[1240px] gap-12 px-6 pb-14 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pb-20 lg:pt-14">
            <div>
              <p className="flex items-center gap-3 font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
                Free &amp; open source · no watermark
              </p>

              <h1 className="mt-5 max-w-[13ch] font-display text-[clamp(2.9rem,7vw,5.6rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
                Your certificate,
                <br />
                <span className="italic text-accent">at any scale.</span>
              </h1>

              <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
                Design one certificate. Mark the fields that change. Turn a CSV or Excel sheet into
                a folder of finished PNGs — without a design tool, a mail merge, or a single manual
                export.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="accent" className="gap-2">
                  <Link to="/login">
                    Start designing
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/how-it-works">See how it works</Link>
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/15 pt-4 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
                {["Private templates", "500 rows per batch", "PNG + ZIP output"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-valid" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="relative">
                <div aria-hidden className="absolute -inset-3 border border-ink/20" />
                <div aria-hidden className="absolute -inset-1.5 border border-ink/30" />
                <SpecimenCertificate
                  recipient={recipient}
                  course={course}
                  date={date}
                  serial={serial}
                  className="relative"
                />
              </div>

              <div className="relative mt-8 border border-ink/25 bg-card p-4 shadow-[0_1px_0_rgb(18_37_29/8%)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="micro text-muted-foreground">Live specimen · edit the strip</p>
                  <button
                    type="button"
                    onClick={randomise}
                    className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-accent underline decoration-accent/40 underline-offset-4 transition hover:decoration-accent"
                  >
                    Shuffle
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                  <div>
                    <Label htmlFor="hero-name">Recipient</Label>
                    <Input
                      id="hero-name"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      maxLength={40}
                      className="mt-1.5 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-course">Course</Label>
                    <Input
                      id="hero-course"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      maxLength={42}
                      className="mt-1.5 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-date">Date</Label>
                    <Input
                      id="hero-date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      maxLength={24}
                      className="mt-1.5 h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-serial">Serial</Label>
                    <Input
                      id="hero-serial"
                      value={serial}
                      onChange={(e) => setSerial(e.target.value)}
                      maxLength={18}
                      className="mt-1.5 h-9 font-mono"
                    />
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-2 border-t border-dashed border-ink/20 pt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  This specimen is synthetic and rendered in your browser. Nothing you type here is
                  sent to a server.
                </p>
              </div>
            </div>
          </div>

          <a
            href="#workflow"
            className="mx-auto flex max-w-[1240px] items-center gap-3 border-t border-ink/20 px-6 py-4 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
          >
            <ArrowDown className="h-3 w-3" aria-hidden />
            Follow one certificate from design to issued record
          </a>
        </section>

        {/* ── Workflow band ────────────────────────────────────────────── */}
        <section id="workflow" className="border-b border-ink/25 bg-card">
          <div className="mx-auto max-w-[1240px] px-6 pb-14 pt-12 md:pb-20 md:pt-16">
            <div className="flex flex-col justify-between gap-4 border-b border-ink pb-4 md:flex-row md:items-end">
              <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Four steps. No handoff.
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                The editor and the renderer share one coordinate system, so the certificate you
                place is the certificate that comes out.
              </p>
            </div>

            <ol className="grid md:grid-cols-4">
              {workflow.map((step, i) => (
                <li
                  key={step.n}
                  className={`relative border-ink/15 py-7 md:px-6 md:py-8 ${
                    i > 0 ? "border-t md:border-l md:border-t-0" : ""
                  } ${i === 0 ? "md:pl-0" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="serial text-[0.6875rem] text-accent">{step.n}</span>
                    <step.icon className="h-4 w-4 text-ink/45" aria-hidden />
                  </div>
                  <h3 className="mt-5 font-display text-xl leading-tight tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-2 flex flex-col gap-3 border-t border-ink/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
                Background image + placeholders + rows = ZIP of PNGs
              </p>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4 hover:decoration-2"
              >
                Walk through a real batch <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Editor explanation ───────────────────────────────────────── */}
        <section className="border-b border-ink/20">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-14 md:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="micro flex items-center gap-3 text-muted-foreground">
                <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
                The editor
              </p>
              <h2 className="mt-5 max-w-[18ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Place it once. It stays placed.
              </h2>
              <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">
                Text, uploaded images, fonts, size, colour, and alignment all live on a canvas that
                matches your background exactly. Mark a field as dynamic and the generator uses the
                same position and scale for every row.
              </p>

              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  [
                    "Custom placeholders",
                    "Any {field} you define in the editor can be a spreadsheet column.",
                  ],
                  [
                    "Autosave",
                    "Every change is written back to your template; the save status is always visible.",
                  ],
                  [
                    "Image elements",
                    "Crests, signatures, and sponsor marks sit alongside text layers.",
                  ],
                  [
                    "Preview before batch",
                    "Generate one certificate with real values before spending a run.",
                  ],
                ].map(([term, desc]) => (
                  <div key={term} className="border-t border-ink/20 pt-3">
                    <dt className="text-sm font-semibold">{term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Authored editor specimen */}
            <div className="relative">
              <div aria-hidden className="absolute -inset-2 border border-ink/20" />
              <div className="relative border border-ink bg-[#eef2e8]">
                <div className="flex items-center justify-between border-b border-ink/25 px-4 py-2.5">
                  <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink/60">
                    Template 014 · Community First Aid
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-valid">
                    <span className="h-1 w-1 bg-valid" aria-hidden />
                    Saved
                  </span>
                </div>
                <div className="grid grid-cols-[92px_1fr]">
                  <div className="border-r border-ink/20 p-2.5">
                    {["Text", "Name", "Date", "Course", "Image"].map((tool) => (
                      <div
                        key={tool}
                        className="mb-1 flex items-center gap-2 border border-transparent px-1.5 py-1.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-ink/70"
                      >
                        <span className="h-2 w-2 border border-ink/40" aria-hidden />
                        {tool}
                      </div>
                    ))}
                    <div className="mt-6 border-t border-dashed border-ink/25 pt-3 font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.1em] text-ink/40">
                      Autosave
                      <br />
                      on
                    </div>
                  </div>
                  <div className="relative h-[320px] bg-[#e3e8dc] p-4">
                    <div className="relative h-full w-full border border-ink/35 bg-[#f8f4e8]">
                      <div aria-hidden className="absolute inset-2 border border-ink/15" />
                      <div className="absolute inset-x-6 top-7 text-center">
                        <p className="font-mono text-[0.4rem] uppercase tracking-[0.26em] text-ink/40">
                          Certificate of completion
                        </p>
                        <p className="mt-2 border border-dashed border-accent/70 px-2 py-1 font-display text-2xl leading-none">
                          {"{name}"}
                        </p>
                        <div className="mx-auto mt-2 h-px w-24 bg-ink/30" />
                        <p className="mt-3 font-mono text-[0.4rem] uppercase tracking-[0.18em] text-ink/40">
                          has completed
                        </p>
                        <p className="mt-1 border border-dashed border-accent/70 px-2 py-1 font-display text-base italic">
                          {"{course}"}
                        </p>
                      </div>
                      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                        <div className="w-20">
                          <p className="border-t border-ink/40 pt-1 font-mono text-[0.4rem] uppercase tracking-[0.1em] text-ink/50">
                            {"{date}"}
                          </p>
                        </div>
                        <div className="h-9 w-9 rounded-full border border-accent/50">
                          <div className="guilloche-fine h-full w-full rounded-full opacity-60" />
                        </div>
                      </div>
                    </div>
                    <div
                      aria-hidden
                      className="absolute right-1 top-1/2 h-20 w-3 -translate-y-1/2 bg-accent"
                    />
                  </div>
                </div>
                <div className="border-t border-ink/25 px-4 py-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/45">
                  Synthetic editor preview · names and data are invented
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Batch facts ──────────────────────────────────────────────── */}
        <section className="border-b border-ink/25 bg-ink text-primary-foreground">
          <div className="mx-auto max-w-[1240px] px-6 py-14 md:py-18">
            <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
              <div>
                <p className="micro text-primary-foreground/55">Batch behaviour</p>
                <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                  A ZIP, a log, and no surprises.
                </h2>
                <p className="mt-5 max-w-prose leading-relaxed text-primary-foreground/70">
                  Every row is rendered independently. If one fails, the rest still complete, and
                  the batch log tells you which row needed attention. Download the same batch again
                  from your history.
                </p>
              </div>

              <dl className="divide-y divide-primary-foreground/15 border-y border-primary-foreground/20">
                {[
                  ["500", "rows per batch, the only hard limit"],
                  ["2", "accepted spreadsheet formats: CSV and XLSX"],
                  ["PNG", "one finished file per row, ZIP delivered"],
                  ["1", "public surface: the verification page"],
                ].map(([value, label]) => (
                  <div key={label} className="grid grid-cols-[80px_1fr] items-baseline gap-4 py-4">
                    <dt className="font-display text-3xl font-semibold tracking-tight">{value}</dt>
                    <dd className="text-sm text-primary-foreground/70">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── Verification ─────────────────────────────────────────────── */}
        <section className="border-b border-ink/20">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-14 md:py-20 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center border border-ink/30">
                  <ScanLine className="h-5 w-5" aria-hidden />
                </span>
                <p className="micro text-muted-foreground">Public verification</p>
              </div>
              <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                A certificate that can prove itself.
              </h2>
              <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">
                Turn on the optional QR code and each generated certificate carries a unique link.
                The recipient scans it and sees the recipient name, template name, and issue date —
                no account needed, no private template exposed.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Works on any phone camera; no app required.",
                  "Shows only the fields needed to confirm the record.",
                  "Verification pages are the only public app surface.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-valid" aria-hidden />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div aria-hidden className="absolute -inset-2 border border-ink/20" />
              <div className="relative border border-ink bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between border-b border-ink/20 pb-4">
                  <div>
                    <p className="micro text-muted-foreground">Certificate lookup</p>
                    <p className="mt-2 font-display text-2xl tracking-tight">Check a record</p>
                  </div>
                  <QrCode className="h-8 w-8 text-ink/50" aria-hidden />
                </div>
                <div className="mt-6">
                  <VerificationForm compact />
                </div>
                <p className="mt-6 border-t border-dashed border-ink/20 pt-4 text-xs leading-relaxed text-muted-foreground">
                  Issued certificate? Paste the code beneath the QR mark. If you do not have a code,
                  ask the organisation that issued the certificate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Free / open source ───────────────────────────────────────── */}
        <section className="border-b border-ink/20 bg-card">
          <div className="mx-auto max-w-[1240px] px-6 py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="micro flex items-center gap-3 text-muted-foreground">
                  <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
                  The commitments
                </p>
                <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                  Free means free.
                </h2>
                <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">
                  QuickCert is a small, MIT-licensed project. There is no upgrade path, no
                  per-certificate charge, and no watermark waiting to be removed.
                </p>
              </div>

              <div className="grid gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
                {[
                  {
                    icon: Sparkles,
                    title: "No paid tier",
                    body: "Every feature is available to every account.",
                  },
                  {
                    icon: Lock,
                    title: "Private by default",
                    body: "Templates belong to you. Only verification is public.",
                  },
                  {
                    icon: Check,
                    title: "Open source",
                    body: "Read it, self-host it, or adapt it under the MIT licence.",
                  },
                ].map((item) => (
                  <div key={item.title} className="bg-card p-5">
                    <item.icon className="h-5 w-5 text-accent" aria-hidden />
                    <h3 className="mt-4 font-display text-xl tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="border-b border-ink/20">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="micro flex items-center gap-3 text-muted-foreground">
                <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
                Questions
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Before you start.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                The short answers. The walkthrough covers the full workflow.
              </p>
              <div className="mt-6">
                <InlineFaqLink />
              </div>
            </div>
            <FaqList />
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-background">
          <div
            aria-hidden
            className="absolute -right-20 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full opacity-[0.08] guilloche"
          />
          <div className="relative mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center md:py-20">
            <div>
              <p className="micro text-muted-foreground">Create your first template</p>
              <h2 className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
                Your next batch is a spreadsheet away.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Create a free account, upload your background, and make the first certificate. No
                card, no trial clock.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent" className="gap-2">
                <Link to="/login">
                  Start designing
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/verify">Verify a certificate</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
