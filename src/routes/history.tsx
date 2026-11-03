import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, FileArchive, FileImage, Search, Sparkles } from "lucide-react";
import { SitePage } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, API_BASE, type GeneratedCertificateResponse } from "@/lib/api";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/history")({
  head: () =>
    pageHead({
      title: "Generation ledger — QuickCert",
      description: "Every certificate you have generated.",
      path: "/history",
      noindex: true,
    }),
  component: HistoryPage,
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function downloadUrl(filePath: string): string {
  const clean = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE}/${clean}`;
}

type Filter = "all" | "single" | "bulk";

function HistoryPage() {
  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.listHistory(),
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return history.filter((item) => {
      if (filter === "single" && item.is_bulk) return false;
      if (filter === "bulk" && !item.is_bulk) return false;
      if (!query.trim()) return true;
      const haystack = `${item.template_name} ${item.recipient ?? ""}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [history, filter, query]);

  return (
    <SitePage>
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-ink pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="micro flex items-center gap-3 text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
              Generation ledger · newest first
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
              History
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every issued file stays here for re-download. Bulk runs are ZIP archives; individual
              certificates are PNG images.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 gap-2">
            <Link to="/templates">
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate more
            </Link>
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 flex flex-col gap-3 border border-destructive/40 bg-destructive/[0.06] p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span>Could not load history. Check that the backend is running.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-b border-ink/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter records">
            {(
              [
                ["all", `All (${history.length})`],
                ["single", `Single PNG (${history.filter((h) => !h.is_bulk).length})`],
                ["bulk", `Bulk ZIP (${history.filter((h) => h.is_bulk).length})`],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`border px-3 py-2 font-mono text-[0.5625rem] uppercase tracking-[0.12em] transition-colors ${
                  filter === value
                    ? "border-ink bg-ink text-primary-foreground"
                    : "border-ink/25 bg-transparent text-muted-foreground hover:border-ink/50 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search template or recipient"
              aria-label="Search history"
              className="h-9 pl-9"
            />
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse border border-ink/10 bg-muted/40" />
            ))}
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className="mt-10 border border-dashed border-ink/30 bg-card/60 px-6 py-16 text-center">
            <FileImage className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 font-display text-2xl tracking-tight">Nothing issued yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Generate a single preview or a batch and it will appear here for re-download.
            </p>
            <Button asChild className="mt-5 gap-2">
              <Link to="/templates">
                Go to templates <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && history.length > 0 && rows.length === 0 && (
          <div className="mt-6 border border-ink/15 bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No records match this filter or search.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border border-ink/20">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Certificate generation history</caption>
              <thead>
                <tr className="border-b border-ink/25 bg-[#eef2e8] text-left">
                  {["Template", "Recipient", "Type", "Generated", "File"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3 font-mono text-[0.5rem] font-normal uppercase tracking-[0.14em] text-muted-foreground ${
                        heading === "File" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 bg-card">
                {rows.map((cert) => (
                  <HistoryRow key={cert.id} cert={cert} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {history.length >= 50 && (
          <p className="mt-4 text-xs text-muted-foreground">Showing the 50 most recent records.</p>
        )}
      </div>
    </SitePage>
  );
}

function HistoryRow({ cert }: { cert: GeneratedCertificateResponse }) {
  const url = downloadUrl(cert.file_path);
  const fileName = cert.file_path.split("/").pop() ?? "certificate";

  return (
    <tr className="transition-colors hover:bg-[#eef2e8]/60">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="serial text-[0.5rem] text-muted-foreground">
            {String(cert.id).padStart(4, "0")}
          </span>
          {cert.template_id ? (
            <Link
              to="/editor/$id"
              params={{ id: String(cert.template_id) }}
              className="font-medium underline decoration-transparent underline-offset-4 transition hover:decoration-accent"
            >
              {cert.template_name}
            </Link>
          ) : (
            <span className="text-muted-foreground">{cert.template_name}</span>
          )}
        </div>
      </td>
      <td className="max-w-[220px] truncate px-4 py-3.5 text-muted-foreground">
        {cert.recipient || <span aria-label="No recipient">—</span>}
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 border border-ink/25 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground">
          {cert.is_bulk ? (
            <FileArchive className="h-3 w-3" aria-hidden />
          ) : (
            <FileImage className="h-3 w-3" aria-hidden />
          )}
          {cert.is_bulk ? "Bulk ZIP" : "Single PNG"}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
        {formatDate(cert.generated_at)}
      </td>
      <td className="px-4 py-3.5 text-right">
        <a
          href={url}
          download={fileName}
          className="inline-flex items-center gap-1.5 border border-ink/30 px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-ink hover:bg-ink hover:text-primary-foreground"
        >
          <Download className="h-3 w-3" aria-hidden />
          {cert.is_bulk ? "Download ZIP" : "Download PNG"}
        </a>
      </td>
    </tr>
  );
}
