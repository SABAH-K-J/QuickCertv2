import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage, PageHeader, Section } from "@/components/site/SitePage";
import { pageHead, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Terms of use — QuickCert",
      description:
        "The terms that apply to using the QuickCert certificate editor and bulk generator, including the MIT licence and acceptable use.",
      path: "/terms",
      jsonLd: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Terms", item: absoluteUrl("/terms") },
        ],
      },
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SitePage>
      <PageHeader
        eyebrow="Terms of use"
        title={
          <>
            Plain terms.
            <br />
            <span className="italic text-accent">No fine print.</span>
          </>
        }
        lede="QuickCert is free, open-source software. These terms describe the hosted application; the source code is governed by the MIT licence."
      >
        <p className="mt-6 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
          Last updated · 3 November 2026
        </p>
      </PageHeader>

      <Section>
        <div className="prose-doc mx-auto max-w-none">
          <h2 className="!mt-0 !border-t-0 !pt-0">Using the service</h2>
          <p>
            You may use QuickCert to design certificate templates and generate certificates for
            lawful purposes. You are responsible for the content you upload, the accuracy of the
            data you supply, and having the right to use any background image, crest, signature, or
            logo you include.
          </p>

          <h2>Your account</h2>
          <p>
            Keep your password confidential and use an account you are entitled to use. You are
            responsible for activity performed with your session. If you believe your account has
            been compromised, sign out and change your password on the instance where you
            registered.
          </p>

          <h2>Acceptable use</h2>
          <p>Do not use QuickCert to:</p>
          <ul>
            <li>Create forged, misleading, or fraudulent documents.</li>
            <li>
              Impersonate an organisation or issue credentials you are not authorised to issue.
            </li>
            <li>
              Upload malware, unlawful material, or content that violates another person’s rights.
            </li>
            <li>Probe, overload, or disrupt the service or another account.</li>
          </ul>
          <p>
            Verification confirms that a record exists in QuickCert. It does not independently prove
            that the issuing organisation was entitled to issue it. Recipients should confirm the
            issuer through their own channels when the stakes are high.
          </p>

          <h2>Limits</h2>
          <p>
            The current application caps a bulk generation at 500 rows and accepts CSV and XLSX
            files. Generated output is PNG, delivered individually or as a ZIP. Limits may change as
            the software develops; the documented behaviour on this site describes the current
            release.
          </p>

          <h2>Availability and changes</h2>
          <p>
            The hosted service is provided on a best-effort basis. It may be unavailable during
            maintenance, upgrades, or infrastructure incidents. Features may change. Because the
            code is open source, you can run your own instance if you need a guaranteed environment.
          </p>

          <h2>Intellectual property</h2>
          <p>
            You retain ownership of the images, text, and data you upload. You grant the instance
            operator the limited permission needed to store and process that content to provide the
            service. The QuickCert source code is licensed under the MIT licence; the name and
            wordmark are not granted for misleading use.
          </p>

          <h2>No warranty</h2>
          <p>
            QuickCert is provided “as is”, without warranty of any kind, express or implied,
            including fitness for a particular purpose. To the maximum extent permitted by law, the
            project and its contributors are not liable for any loss arising from use of the
            software or service.
          </p>

          <h2>Ending use</h2>
          <p>
            You may stop using QuickCert at any time. The operator may suspend an account that
            abuses the service or violates these terms. Data handling is described in the{" "}
            <Link to="/privacy">privacy notice</Link>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions can be raised through the{" "}
            <a
              href="https://github.com/SABAH-K-J/QuickCertV2/issues"
              target="_blank"
              rel="noreferrer"
            >
              project issue tracker
            </a>
            .
          </p>

          <div className="mt-10 border-t border-ink/20 pt-6">
            <p className="text-sm text-muted-foreground">
              Back to the <Link to="/">home page</Link> or read{" "}
              <Link to="/about">about the project</Link>.
            </p>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
