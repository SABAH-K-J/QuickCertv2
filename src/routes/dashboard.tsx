import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  FileArchive,
  FileImage,
  History as HistoryIcon,
  LayoutTemplate,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { SitePage } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { api, assetUrl } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    pageHead({
      title: "Overview — QuickCert",
      description: "Your QuickCert workspace.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function DashboardPage() {
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "there";

  const {
    data: templates = [],
    isLoading: loadingTemplates,
    isError: templatesError,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: api.listTemplates,
  });

  const {
    data: history = [],
    isLoading: loadingHistory,
    isError: historyError,
  } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.listHistory(0, 6),
  });

  const bulkRuns = history.filter((h) => h.is_bulk).length;

  return (
    <SitePage>
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-ink pb-6 md:flex-row md:items-end">
          <div>
            <p className="micro flex items-center gap-3 text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
              Workspace · {new Date().getFullYear()}
            </p>
            <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pick up a template, start a batch, or check what has already been issued.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2">
              <Link to="/templates">
                <Plus className="h-4 w-4" aria-hidden />
                New template
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/history">
                <HistoryIcon className="h-4 w-4" aria-hidden />
                History
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
          {[
            {
              label: "Templates",
              value: loadingTemplates ? "—" : String(templates.length),
              sub: templates.length === 1 ? "design ready" : "designs ready",
              icon: LayoutTemplate,
            },
            {
              label: "Issued records",
              value: loadingHistory ? "—" : String(history.length),
              sub: "most recent shown below",
              icon: FileImage,
            },
            {
              label: "Bulk batches",
              value: loadingHistory ? "—" : String(bulkRuns),
              sub: "in the latest records",
              icon: FileArchive,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="micro text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-ink/40" aria-hidden />
              </div>
              <p className="mt-4 font-display text-5xl leading-none tracking-[-0.03em]">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        {(templatesError || historyError) && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 border border-destructive/40 bg-destructive/[0.06] p-4 text-sm"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p>
              Some workspace data could not be loaded. Check that the backend is running, then
              refresh the page.
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section aria-labelledby="templates-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="micro text-muted-foreground">Your templates</p>
                <h2 id="templates-heading" className="mt-2 font-display text-2xl tracking-tight">
                  Ready to issue
                </h2>
              </div>
              <Link
                to="/templates"
                className="inline-flex items-center gap-1 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
              {loadingTemplates &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-4 py-4">
                    <div className="h-14 w-20 bg-muted" />
                    <div className="h-4 flex-1 bg-muted" />
                  </div>
                ))}

              {!loadingTemplates &&
                templates.slice(0, 4).map((template) => (
                  <div key={template.id} className="flex items-center gap-4 py-4">
                    <Link
                      to="/editor/$id"
                      params={{ id: String(template.id) }}
                      className="h-14 w-20 shrink-0 overflow-hidden border border-ink/20 bg-surface"
                      aria-label={`Edit ${template.name}`}
                    >
                      {template.background_image ? (
                        <img
                          src={assetUrl(template.background_image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{template.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {template.description || "No description"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/editor/$id" params={{ id: String(template.id) }}>
                          Edit
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/generate/$id" params={{ id: String(template.id) }}>
                          Generate
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

              {!loadingTemplates && templates.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No templates yet.</p>
                  <Button asChild className="mt-4 gap-2">
                    <Link to="/templates">
                      <Plus className="h-4 w-4" aria-hidden /> Create your first template
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="activity-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="micro text-muted-foreground">Recent records</p>
                <h2 id="activity-heading" className="mt-2 font-display text-2xl tracking-tight">
                  Issued recently
                </h2>
              </div>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4"
              >
                Ledger <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
              {loadingHistory &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse bg-muted/40" />
                ))}

              {!loadingHistory &&
                history.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.template_name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.recipient || "Batch"} · {formatDate(item.generated_at)}
                      </p>
                    </div>
                    <span className="shrink-0 border border-ink/25 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {item.is_bulk ? "ZIP" : "PNG"}
                    </span>
                  </div>
                ))}

              {!loadingHistory && history.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No records yet.</p>
                  <Button asChild variant="outline" className="mt-3 gap-2">
                    <Link to="/templates">
                      Start a batch <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 border border-ink/20 bg-card p-4">
              <p className="micro text-muted-foreground">Next step</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Need to check a certificate a recipient received? The public verification page needs
                no account.
              </p>
              <Link
                to="/verify"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4"
              >
                Open verification <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SitePage>
  );
}
