import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock, QrCode, ScanLine } from "lucide-react";
import { SitePage, PageHeader, Section } from "@/components/site/SitePage";
import { VerificationForm } from "@/components/site/VerificationForm";
import { Button } from "@/components/ui/button";
import { absoluteUrl, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/verify/")({
  head: () =>
    pageHead({
      title: "Verify a certificate — QuickCert",
      description:
        "Check a QuickCert certificate record by its verification code or QR link. No account required.",
      path: "/verify",
      jsonLd: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Verify", item: absoluteUrl("/verify") },
        ],
      },
    }),
  component: VerifyIndexPage,
});

function VerifyIndexPage() {
  return (
    <SitePage>
      <PageHeader
        eyebrow="Public record lookup"
        title={
          <>
            Check a certificate
            <br />
            <span className="italic text-accent">before you trust it.</span>
          </>
        }
        lede="Enter the verification code printed beneath the QR mark on a QuickCert certificate. You’ll see the record that was issued — no account, no personal data beyond the certificate itself."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="border border-ink bg-card p-6 sm:p-8">
              <div className="flex items-start justify-between border-b border-ink/20 pb-4">
                <div>
                  <p className="micro text-muted-foreground">Step 01</p>
                  <h2 className="mt-2 font-display text-2xl tracking-tight">Enter the code</h2>
                </div>
                <ScanLine className="h-7 w-7 text-ink/40" aria-hidden />
              </div>
              <div className="mt-6">
                <VerificationForm />
              </div>
            </div>

            <div className="mt-8 space-y-5 border-t border-ink/20 pt-6">
              {[
                {
                  icon: QrCode,
                  title: "Where to find it",
                  body: "The code sits under the verification mark on the certificate. If you received a link, you can paste the whole URL into the field.",
                },
                {
                  icon: Check,
                  title: "What a match means",
                  body: "The recipient, template name, and issue date on the certificate match a record held by QuickCert.",
                },
                {
                  icon: Lock,
                  title: "What it does not mean",
                  body: "It does not prove the issuer was authorised to award the credential. Confirm the issuer separately when it matters.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-ink/25">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="relative">
              <div aria-hidden className="absolute -inset-2 border border-ink/20" />
              <div className="relative border border-ink bg-[#eef2e8] p-6">
                <p className="micro text-muted-foreground">Verification slip</p>
                <div className="mt-4 border border-dashed border-ink/30 bg-card p-5">
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
                    QuickCert · public record
                  </p>
                  <dl className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
                    {[
                      ["Recipient", "Amara Diallo"],
                      ["Template", "Community First Aid"],
                      ["Issued", "14 June 2026"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                        <dt className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                          {k}
                        </dt>
                        <dd className="text-sm">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-valid">
                    <span className="h-1.5 w-1.5 bg-valid" aria-hidden />
                    Example of a valid record
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  The example above is synthetic. A real lookup shows only the record fields listed
                  here.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="micro text-muted-foreground">For issuers</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enable the optional QR code when generating an individual certificate to add a
                verification link.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/how-it-works" hash="step-5">
                  How verification is added
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </Section>
    </SitePage>
  );
}
