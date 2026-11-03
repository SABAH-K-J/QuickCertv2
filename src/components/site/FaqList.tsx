import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const faqs = [
  {
    q: "Is QuickCert really free?",
    a: "Yes. QuickCert is free and open source under the MIT licence. There are no paid tiers, no watermarks, and no locked features. You can use the hosted version or run your own copy.",
  },
  {
    q: "What do I need to start?",
    a: "A background image for your certificate (PNG or JPG), a spreadsheet of recipients in CSV or XLSX format, and a browser. The editor works best on a desktop or laptop.",
  },
  {
    q: "How many certificates can I generate at once?",
    a: "Up to 500 rows per batch. Each generation produces a ZIP file containing one PNG per row, and a log if any rows could not be processed.",
  },
  {
    q: "Can I use my own fonts and images?",
    a: "Yes. Upload your background image, add image elements such as a crest or signature, and choose from the font list. Text elements can be static or dynamic placeholders.",
  },
  {
    q: "How does verification work?",
    a: "If you enable the optional QR code when generating, each certificate gets a unique token and a public verification page. Recipients can scan the code without creating an account. The page shows the recipient, template name, and issue date.",
  },
  {
    q: "Who can see my templates and data?",
    a: "Templates are private to your account. Recipients’ spreadsheet data is used only to render the certificates you request. The generated files remain in your history for re-download.",
  },
  {
    q: "Can I self-host QuickCert?",
    a: "Yes. The repository includes the frontend and backend, with setup instructions for local development and deployment. The MIT licence lets you adapt it for your organisation.",
  },
];

export function FaqList() {
  return (
    <div className="divide-y divide-ink/15 border-y border-ink/20">
      {faqs.map((item, i) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="flex gap-4">
              <span className="mt-1 font-mono text-[0.5625rem] tracking-[0.14em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                {item.q}
              </span>
            </span>
            <span
              aria-hidden
              className="relative mt-2 h-3 w-3 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:bg-ink after:absolute after:left-1/2 after:top-0 after:h-3 after:w-px after:bg-ink after:transition-transform group-open:after:scale-y-0"
            />
          </summary>
          <div className="pb-6 pl-9 pr-8">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function FaqJsonLd() {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function InlineFaqLink() {
  return (
    <Link
      to="/how-it-works"
      className="inline-flex items-center gap-1 border-b border-ink pb-0.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
    >
      Read the full walkthrough
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}
