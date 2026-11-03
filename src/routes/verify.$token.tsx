import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";
import { SitePage } from "@/components/site/SitePage";
import { VerificationForm } from "@/components/site/VerificationForm";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";
import { pageHead } from "@/lib/seo";

interface VerificationResult {
  valid: boolean;
  recipient?: string | null;
  template_name?: string;
  issued_at?: string;
}

export const Route = createFileRoute("/verify/$token")({
  head: ({ params }) =>
    pageHead({
      title: "Certificate verification — QuickCert",
      description:
        "A public QuickCert verification record. Confirm the recipient, template, and issue date for a certificate.",
      path: `/verify/${params.token}`,
      noindex: true,
    }),
  component: VerifyTokenComponent,
});

function VerifyTokenComponent() {
  const { token } = Route.useParams();

  const { data, isLoading, isError } = useQuery<VerificationResult>({
    queryKey: ["verify", token],
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Verification service unavailable");
      return res.json();
    },
  });

  return (
    <SitePage>
      <div className="mx-auto max-w-[860px] px-6 py-12 md:py-20">
        <p className="micro flex items-center gap-3 text-muted-foreground">
          <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
          Public verification · no account required
        </p>

        <div className="mt-6 border border-ink bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-ink/25 bg-[#eef2e8] px-5 py-4 sm:px-7">
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink/60">
              QuickCert · Registry of record
            </span>
            <span className="serial text-[0.5625rem] text-ink/45">Ref {token.slice(0, 8)}</span>
          </div>

          {isLoading && <LoadingState />}
          {isError && <ErrorState />}
          {!isLoading && !isError && data && <ResultState data={data} token={token} />}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-ink/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Verification confirms that this record exists in QuickCert. It does not independently
            prove that the issuer was authorised to award the credential.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/verify">Check another</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/">
                QuickCert home <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 border border-ink/20 bg-card p-5">
          <p className="micro text-muted-foreground">Need a different code?</p>
          <div className="mt-3">
            <VerificationForm compact />
          </div>
        </div>
      </div>
    </SitePage>
  );
}

function LoadingState() {
  return (
    <div className="px-6 py-16 text-center sm:px-10" aria-live="polite">
      <ScanLine className="mx-auto h-9 w-9 animate-pulse text-muted-foreground" aria-hidden />
      <p className="mt-4 font-display text-2xl tracking-tight">Checking the record…</p>
      <p className="mt-2 text-sm text-muted-foreground">This usually takes a moment.</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="px-6 py-14 text-center sm:px-10">
      <ShieldAlert className="mx-auto h-9 w-9 text-destructive" aria-hidden />
      <h1 className="mt-4 font-display text-3xl tracking-tight">We couldn’t reach the registry</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The verification service did not respond. Check your connection and try again. If the
        problem continues, contact the organisation that issued the certificate.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/verify">Try another code</Link>
      </Button>
    </div>
  );
}

function ResultState({ data, token }: { data: VerificationResult; token: string }) {
  if (!data.valid) {
    return (
      <div className="px-6 py-14 text-center sm:px-10">
        <div className="stamp stamp-void mx-auto w-fit">No matching record</div>
        <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3rem)] leading-[1] tracking-[-0.03em]">
          No certificate found for this code.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          The code may be mistyped, the certificate may have been removed, or the link may not be a
          QuickCert verification link. Check the code printed beneath the QR mark and try again.
        </p>
        <div className="mx-auto mt-6 max-w-sm border border-ink/20 bg-background p-4 text-left">
          <p className="micro text-muted-foreground">Code received</p>
          <p className="mt-2 break-all font-mono text-xs text-foreground/80">{token}</p>
        </div>
        <Button asChild className="mt-6 gap-2">
          <Link to="/verify">
            Enter a different code <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    );
  }

  const issued = data.issued_at ? new Date(data.issued_at) : null;
  const issuedLabel =
    issued && !Number.isNaN(issued.getTime())
      ? issued.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date not recorded";

  return (
    <div>
      <div className="border-b border-ink/20 px-6 py-8 text-center sm:px-10">
        <div className="stamp stamp-valid mx-auto w-fit">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Verified record
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
          {data.recipient || "Certificate holder"}
        </h1>
        <p className="mt-3 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
          This certificate matches a QuickCert record
        </p>
      </div>

      <div className="px-6 py-7 sm:px-10">
        <dl className="divide-y divide-ink/15 border-y border-ink/15">
          {[
            ["Recipient", data.recipient || "Not recorded"],
            ["Template", data.template_name || "Not recorded"],
            ["Issued", issuedLabel],
            ["Verification code", token],
          ].map(([term, value]) => (
            <div key={term} className="grid gap-1 py-3.5 sm:grid-cols-[150px_1fr] sm:gap-4">
              <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground sm:pt-0.5">
                {term}
              </dt>
              <dd className="break-words text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-start gap-3 border border-valid/30 bg-valid/[0.06] p-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-valid" aria-hidden />
          <p className="text-xs leading-relaxed text-foreground/80">
            The recipient, template, and issue date above came from the stored record. The public
            page never exposes the issuer’s account details or the original spreadsheet.
          </p>
        </div>
      </div>
    </div>
  );
}
