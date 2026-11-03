import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileSpreadsheet, Image as ImageIcon, QrCode, Type } from "lucide-react";
import { SitePage, PageHeader, Section } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { pageHead, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead({
      title: "How QuickCert works — design, data, batch, verify",
      description:
        "The complete QuickCert workflow: upload a certificate background, place placeholders, load a CSV or XLSX, generate a ZIP of PNGs, and optionally add QR verification.",
      path: "/how-it-works",
      jsonLd: [
        {
          "@type": "HowTo",
          name: "How to generate certificates in bulk with QuickCert",
          description:
            "Create a certificate template from a background image, mark dynamic fields, and generate one PNG per spreadsheet row.",
          totalTime: "PT10M",
          step: [
            {
              "@type": "HowToStep",
              name: "Create a template",
              text: "Sign in, open Templates, and upload the background image you want to use. Its pixel dimensions become the canvas size.",
              url: absoluteUrl("/how-it-works#step-1"),
            },
            {
              "@type": "HowToStep",
              name: "Place text and image elements",
              text: "Add static text, dynamic placeholders such as {name}, {date}, and {course}, or your own custom field. Upload images for crests and signatures.",
              url: absoluteUrl("/how-it-works#step-2"),
            },
            {
              "@type": "HowToStep",
              name: "Prepare the data",
              text: "Create a CSV or XLSX where the column headings match the placeholder names used in the template.",
              url: absoluteUrl("/how-it-works#step-3"),
            },
            {
              "@type": "HowToStep",
              name: "Generate the batch",
              text: "Open the template, choose Bulk, upload the spreadsheet, and download the ZIP containing one PNG per row. Batches are capped at 500 rows.",
              url: absoluteUrl("/how-it-works#step-4"),
            },
            {
              "@type": "HowToStep",
              name: "Share and verify",
              text: "When generating an individual certificate, enable the optional QR code to add a public verification link. Recipients can confirm the record without an account.",
              url: absoluteUrl("/how-it-works#step-5"),
            },
          ],
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: "How it works",
              item: absoluteUrl("/how-it-works"),
            },
          ],
        },
      ],
    }),
  component: HowItWorksPage,
});

const steps = [
  {
    id: "step-1",
    n: "01",
    title: "Create a template",
    icon: ImageIcon,
    body: "Sign in and open Templates. Upload the certificate background you already designed — a school border, event artwork, or a plain A4 sheet. The image’s pixel size becomes the canvas, so nothing is stretched or cropped by a preset.",
    detail: [
      "PNG, JPG, or other browser-supported image",
      "Your templates are private to your account",
    ],
  },
  {
    id: "step-2",
    n: "02",
    title: "Place the fields",
    icon: Type,
    body: "Add static text for the title and body copy. Add dynamic placeholders for anything that changes per recipient: {name}, {date}, {course}, or a custom field you invent, such as {team} or {grade}. Drag, resize, and set font, size, colour, and alignment.",
    detail: ["Custom {field} names are supported", "Image elements work for crests and signatures"],
  },
  {
    id: "step-3",
    n: "03",
    title: "Prepare the rows",
    icon: FileSpreadsheet,
    body: "Make a spreadsheet with one row per certificate. The column headings must match your placeholder names exactly. Keep the file in CSV or XLSX format. A single row is fine if you only need one certificate.",
    detail: [".csv and .xlsx are accepted", "Maximum 500 rows per batch"],
    table: true,
  },
  {
    id: "step-4",
    n: "04",
    title: "Generate the batch",
    icon: QrCode,
    body: "Open the template and choose Bulk. Upload the spreadsheet and QuickCert renders one PNG per row into a ZIP. If a row fails, the rest still complete and the batch log names the row that needs attention.",
    detail: ["Download once; re-download from History", "Single preview before you run the batch"],
  },
  {
    id: "step-5",
    n: "05",
    title: "Share and verify",
    icon: Check,
    body: "Send the PNGs however you normally would. For individual certificates, the optional QR code adds a unique verification link. The recipient scans it and sees the recipient name, template name, and issue date — no login, no private template.",
    detail: ["Public verification needs no account", "Only the verification page is public"],
  },
];

function HowItWorksPage() {
  return (
    <SitePage>
      <PageHeader
        eyebrow="Workflow · 5 steps · about 10 minutes"
        title={
          <>
            From a background image
            <br />
            to a <span className="italic text-accent">batch of records.</span>
          </>
        }
        lede="QuickCert keeps the whole job in one place. Here is exactly what happens between uploading your design and handing out the certificates."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="accent" className="gap-2">
            <Link to="/login">
              Start designing <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/verify">Verify a certificate</Link>
          </Button>
        </div>
      </PageHeader>

      <Section>
        <ol className="divide-y divide-ink/20 border-y border-ink/20">
          {steps.map((step) => (
            <li
              key={step.id}
              id={step.id}
              className="grid gap-6 py-10 md:grid-cols-[80px_1fr_1fr] md:gap-10"
            >
              <div>
                <span className="serial text-sm text-accent">{step.n}</span>
                <step.icon className="mt-3 h-5 w-5 text-ink/45" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.02] tracking-[-0.025em]">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
              <div className="md:pt-2">
                <ul className="space-y-2 border-t border-ink/15 pt-4">
                  {step.detail.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-valid" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
                {step.table && (
                  <div className="mt-5 overflow-x-auto border border-ink/20 bg-card">
                    <table className="w-full min-w-[360px] text-left text-xs">
                      <caption className="border-b border-ink/15 px-3 py-2 text-left font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                        Example CSV · synthetic names
                      </caption>
                      <thead>
                        <tr className="border-b border-ink/15 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                          <th scope="col" className="px-3 py-2 font-normal">
                            name
                          </th>
                          <th scope="col" className="px-3 py-2 font-normal">
                            course
                          </th>
                          <th scope="col" className="px-3 py-2 font-normal">
                            date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        {[
                          ["Amara Diallo", "Community First Aid", "2026-06-14"],
                          ["Jonas Weber", "Community First Aid", "2026-06-14"],
                          ["Priya Raman", "Community First Aid", "2026-06-14"],
                        ].map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell) => (
                              <td key={cell} className="px-3 py-2 text-foreground/80">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="card">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="micro text-muted-foreground">Limits, stated plainly</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,3.5vw,2.75rem)] leading-[1] tracking-[-0.03em]">
              What QuickCert does — and does not do.
            </h2>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
              There is no hidden capability and no upsell. These are the actual boundaries of the
              current version.
            </p>
          </div>
          <dl className="divide-y divide-ink/15 border-y border-ink/20">
            {[
              ["Output", "PNG images, delivered individually or as a ZIP."],
              ["Input", "CSV and XLSX spreadsheets; a background image; uploaded image elements."],
              ["Batch size", "500 rows per generation."],
              ["Fonts", "The editor’s font list plus your uploaded images."],
              ["QR verification", "Available on individual certificate generation."],
              ["Accounts", "Email and password. Templates are private to the owner."],
              ["Not included", "PDF export, email delivery, and scheduled batches."],
            ].map(([term, value]) => (
              <div key={term} className="grid gap-1 py-3 sm:grid-cols-[130px_1fr] sm:gap-4">
                <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground sm:pt-0.5">
                  {term}
                </dt>
                <dd className="text-sm text-foreground/85">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="micro text-muted-foreground">Ready when you are</p>
            <h2 className="mt-3 max-w-[24ch] font-display text-[clamp(1.9rem,4vw,3rem)] leading-[0.98] tracking-[-0.03em]">
              Try it with one row before you try 500.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent" className="gap-2">
              <Link to="/login">
                Create a free account <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">About the project</Link>
            </Button>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
