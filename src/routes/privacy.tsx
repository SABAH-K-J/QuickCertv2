import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage, PageHeader, Section } from "@/components/site/SitePage";
import { pageHead, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy notice — QuickCert",
      description:
        "What QuickCert stores, why it stores it, how generated files and verification pages work, and how to remove your data.",
      path: "/privacy",
      jsonLd: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Privacy", item: absoluteUrl("/privacy") },
        ],
      },
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SitePage>
      <PageHeader
        eyebrow="Privacy notice"
        title={
          <>
            What we store.
            <br />
            <span className="italic text-accent">And what we don’t.</span>
          </>
        }
        lede="This notice describes the behaviour of the QuickCert application. If you self-host QuickCert, the operator of that instance is responsible for its data."
      >
        <p className="mt-6 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
          Last updated · 3 November 2026
        </p>
      </PageHeader>

      <Section>
        <div className="prose-doc mx-auto max-w-none">
          <h2 className="!mt-0 !border-t-0 !pt-0">Account data</h2>
          <p>
            Creating an account stores your name, email address, and a bcrypt password hash. The
            plain-text password is never stored or logged. Your session uses a JSON Web Token kept
            in your browser’s local storage. It is not an HttpOnly cookie, so you should sign out on
            shared devices and avoid running third-party scripts on a copy of the app that you do
            not trust.
          </p>

          <h2>Template data</h2>
          <p>
            Templates store the name, description, background image, canvas dimensions, and every
            positioned text or image element. Uploaded images are written to the server’s storage.
            Templates are queried by owner, so one account cannot list or generate from another
            account’s template by guessing its identifier.
          </p>

          <h2>Spreadsheet data</h2>
          <p>
            When you generate a batch, the uploaded CSV or XLSX is read to render each row.
            QuickCert does not keep the original spreadsheet. It does store a generation-history
            entry containing the template name, a recipient label (the name value for a single
            certificate, or a row count for a batch), the output file path, and the time of
            generation. Rendered PNG and ZIP files remain on the server so you can download them
            again from History.
          </p>

          <h2>Generated files</h2>
          <p>
            Generated files are served from a static path on the backend. The path includes a random
            batch identifier, but the file itself is not protected by a login. Anyone who has the
            full file URL can open it. Treat download links as you would the certificate itself.
          </p>

          <h2>Verification pages</h2>
          <p>
            If you enable the optional QR code for an individual certificate, QuickCert stores a
            random verification token and publishes a page at <code>/verify/&lt;token&gt;</code>.
            That page is deliberately public. It shows the recipient label, template name, and issue
            date. It does not expose your email address, your template design, or the spreadsheet
            row. If a certificate is deleted from history, its token no longer resolves to a valid
            record.
          </p>

          <h2>Logs and infrastructure</h2>
          <p>
            The application server records ordinary operational logs, such as request errors and
            authentication failures. Those logs may include account identifiers and request
            metadata. They are used to operate and secure the service, not to build advertising
            profiles. QuickCert has no advertising, analytics, or tracking pixels in the
            application.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>Delete templates you no longer need from the Templates screen.</li>
            <li>Generated history and files can be removed by the instance operator.</li>
            <li>To remove an account and its data, contact the operator of your instance.</li>
            <li>Self-host QuickCert if you need full control over retention.</li>
          </ul>

          <h2>Children</h2>
          <p>
            QuickCert is a general-purpose document tool, not a service directed at children. Do not
            create an account for a child without the consent of a parent or guardian.
          </p>

          <h2>Changes</h2>
          <p>
            If this notice changes, the date at the top of the page will change with it. Because the
            project is open source, the history of the application’s data handling is also visible
            in the repository.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this notice can be raised through the project’s{" "}
            <a
              href="https://github.com/SABAH-K-J/QuickCertV2/issues"
              target="_blank"
              rel="noreferrer"
            >
              GitHub issue tracker
            </a>
            . For a self-hosted instance, contact its operator.
          </p>

          <div className="mt-10 border-t border-ink/20 pt-6">
            <p className="text-sm text-muted-foreground">
              Read the <Link to="/terms">terms of use</Link> or return to the{" "}
              <Link to="/">home page</Link>.
            </p>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}
