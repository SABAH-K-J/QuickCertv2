import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Github, HeartHandshake, Lock, Scale, Sparkles } from "lucide-react";
import { SitePage, PageHeader, Section } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { absoluteUrl, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About QuickCert — free, open-source certificate software",
      description:
        "Why QuickCert exists, what it costs (nothing), how it handles privacy, and how to self-host or contribute to the MIT-licensed project.",
      path: "/about",
      jsonLd: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "About", item: absoluteUrl("/about") },
        ],
      },
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SitePage>
      <PageHeader
        eyebrow="About the project"
        title={
          <>
            Small tool.
            <br />
            <span className="italic text-accent">Useful document.</span>
          </>
        }
        lede="QuickCert exists because issuing a certificate should not require design software, a mail-merge tutorial, and an afternoon of exporting files one at a time."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="prose-doc max-w-none">
            <h2 className="!mt-0 !border-t-0 !pt-0">The problem</h2>
            <p>
              Most people who need to issue certificates already have a design. It might be a school
              crest, an event poster, or a border a colleague made years ago. What they do not have
              is a reliable way to put 200 different names onto that design without opening an image
              editor 200 times.
            </p>
            <p>
              Spreadsheet software can merge names into a document, but it is poor at precise
              placement and image output. Design tools can export beautifully, but their data
              features are an afterthought. QuickCert is the narrow space between those two jobs.
            </p>

            <h2>How it works</h2>
            <p>
              A template is a background image plus positioned elements. Some elements are static;
              others contain placeholders such as
              <code>{"{name}"}</code>. When you generate a certificate, each placeholder is replaced
              with the matching column from a spreadsheet row and rendered at the same coordinates.
            </p>
            <p>
              The editor and the renderer share one coordinate system. That is the whole technical
              promise: what you place is what gets printed.
            </p>

            <h2>What it costs</h2>
            <p>
              Nothing. QuickCert is released under the MIT licence. There is no paid tier, no
              watermark, no per-certificate fee, and no feature held back for an upgrade. If the
              hosted instance disappears tomorrow, the source code remains available to run
              yourself.
            </p>

            <h2>Privacy, in one paragraph</h2>
            <p>
              Templates and generation history belong to the account that created them. The public
              verification page is the only surface that does not require a login, and it displays
              only the recipient label, template name, and issue date. Read the full{" "}
              <Link to="/privacy">privacy notice</Link> for the details, including how generated
              files are served.
            </p>

            <h2>Built with</h2>
            <p>
              React, TanStack Start, and Fabric.js on the front end; FastAPI, SQLAlchemy, and Pillow
              on the back end. The repository includes setup instructions for local development and
              deployment.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="border border-ink bg-card p-6">
              <p className="micro text-muted-foreground">Project facts</p>
              <dl className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                {[
                  ["Licence", "MIT"],
                  ["Price", "Free"],
                  ["Watermark", "None"],
                  ["Source", "GitHub"],
                  ["Batch cap", "500 rows"],
                  ["Status", "Actively maintained"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="font-mono text-[0.625rem] uppercase tracking-[0.12em]">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button asChild className="mt-5 w-full gap-2">
                <a href="https://github.com/SABAH-K-J/QuickCertV2" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" aria-hidden />
                  View the source
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </Button>
            </div>

            <div className="grid gap-px border border-ink/20 bg-ink/20">
              {[
                { icon: Sparkles, title: "No upsell", body: "One complete product." },
                { icon: Lock, title: "Private", body: "Your templates stay yours." },
                { icon: Scale, title: "MIT", body: "Fork it, host it, adapt it." },
                { icon: HeartHandshake, title: "Plain language", body: "No dark patterns." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 bg-card p-4">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="card">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="micro text-muted-foreground">Make something official</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3rem)] leading-[0.98] tracking-[-0.03em]">
              Your first template takes a few minutes.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link to="/login">Start designing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">See the workflow</Link>
            </Button>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
