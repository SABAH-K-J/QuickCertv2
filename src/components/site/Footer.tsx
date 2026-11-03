import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/site/BrandMark";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/how-it-works" as const },
      { label: "Verify a certificate", to: "/verify" as const },
      { label: "Sign in", to: "/login" as const },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "About QuickCert", to: "/about" as const },
      { label: "Privacy", to: "/privacy" as const },
      { label: "Terms", to: "/terms" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="no-print border-t border-ink/25 bg-[#dfe5dc]">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A free, open-source way to turn one certificate design and a spreadsheet into finished
              certificates.
            </p>
            <p className="mt-5 flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-valid" aria-hidden />
              MIT licensed · no watermark
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="micro text-ink/60">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="link-underline text-sm text-foreground/85 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="micro text-ink/60">Source</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Read the code, report an issue, or self-host your own copy.
            </p>
            <a
              href="https://github.com/SABAH-K-J/QuickCertV2"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 border-b border-ink pb-0.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              github.com/SABAH-K-J/QuickCertV2
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/20 py-6 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} QuickCert</span>
          <span>Design → data → batch → verify</span>
          <span>Document sample on this site is synthetic</span>
        </div>
      </div>
    </footer>
  );
}
