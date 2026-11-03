import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { SitePage } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { pageHead } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/generate/$id")({
  head: ({ params }) =>
    pageHead({
      title: `Generate certificates — Template #${params.id} — QuickCert`,
      description: "Generate a single certificate or a bulk batch from a spreadsheet.",
      path: `/generate/${params.id}`,
      noindex: true,
    }),
  component: GeneratePage,
});

const MAX_BULK_ROWS = 500;

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function GeneratePage() {
  const { id } = Route.useParams();
  const templateId = Number(id);

  const {
    data: template,
    isLoading: templateLoading,
    error: templateError,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => api.getTemplate(templateId),
  });
  const { data: elements = [], isLoading: elementsLoading } = useQuery({
    queryKey: ["elements", templateId],
    queryFn: () => api.listElements(templateId),
  });

  const placeholders = useMemo(() => {
    const set = new Set<string>();
    for (const el of elements) {
      if (el.placeholder_type) set.add(el.placeholder_type);
    }
    return Array.from(set);
  }, [elements]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [includeQr, setIncludeQr] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (placeholders.includes("date") && !values.date) {
      setValues((v) => ({ ...v, date: todayLabel() }));
    }
    // Only seed the date once, when placeholders first arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholders.join("|")]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function generateOne() {
    setLoading(true);
    try {
      const blob = await api.generateOne(templateId, values, includeQr);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreview(url);
      toast.success(
        includeQr ? "Certificate generated with verification QR" : "Certificate generated",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateBulk() {
    if (!bulkFile) return;
    setBulkLoading(true);
    try {
      const blob = await api.generateBulk(templateId, bulkFile);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(template?.name ?? "certificates").replace(/[^\w-]+/g, "_")}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Batch complete — ZIP downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk generation failed");
    } finally {
      setBulkLoading(false);
    }
  }

  function pickBulkFile(file: File | null) {
    if (!file) {
      setBulkFile(null);
      return;
    }
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      toast.error("Use a .csv or .xlsx file");
      return;
    }
    setBulkFile(file);
  }

  function downloadCsvTemplate() {
    const headers = placeholders.length > 0 ? placeholders : ["name", "course", "date"];
    const example = headers.map((h) => {
      if (h === "name") return "Amara Diallo";
      if (h === "course") return "Community First Aid";
      if (h === "date") return "2026-06-14";
      return "";
    });
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quickcert-columns.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (templateLoading) {
    return (
      <SitePage>
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="h-72 animate-pulse border border-ink/10 bg-muted/40" />
            <div className="h-72 animate-pulse border border-ink/10 bg-muted/40" />
          </div>
        </div>
      </SitePage>
    );
  }

  if (templateError || !template) {
    return (
      <SitePage>
        <div className="mx-auto max-w-[760px] px-6 py-20 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
          <h1 className="mt-4 font-display text-3xl tracking-tight">Template not available</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            It may have been deleted, or it belongs to another account.
          </p>
          <Button asChild className="mt-6">
            <Link to="/templates">Back to templates</Link>
          </Button>
        </div>
      </SitePage>
    );
  }

  return (
    <SitePage>
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <Link
          to="/editor/$id"
          params={{ id }}
          className="inline-flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to editor
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 border-b border-ink pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="micro flex items-center gap-3 text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
              Press run · {placeholders.length} dynamic{" "}
              {placeholders.length === 1 ? "field" : "fields"}
            </p>
            <h1 className="mt-3 max-w-[22ch] font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-[0.96] tracking-[-0.035em]">
              {template.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Preview one certificate, or upload a spreadsheet to render a whole batch. Output is
              PNG; a batch arrives as a ZIP.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 border border-ink/20 bg-card px-4 py-3">
            <div>
              <p className="micro text-muted-foreground">Canvas</p>
              <p className="mt-1 font-mono text-[0.625rem]">
                {template.width ?? "—"} × {template.height ?? "—"} px
              </p>
            </div>
            <div className="border-l border-ink/15 pl-4">
              <p className="micro text-muted-foreground">Batch cap</p>
              <p className="mt-1 font-mono text-[0.625rem]">{MAX_BULK_ROWS} rows</p>
            </div>
          </div>
        </div>

        {!elementsLoading && placeholders.length === 0 && (
          <div className="mt-6 flex flex-col gap-3 border border-ink/25 bg-[#eef2e8] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span>
                This template has no dynamic placeholders yet, so every certificate will look the
                same. Add a {"{name}"} field in the editor first.
              </span>
            </p>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to="/editor/$id" params={{ id }}>
                Open editor
              </Link>
            </Button>
          </div>
        )}

        <Tabs defaultValue="single" className="mt-8">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Single certificate
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
              Batch from spreadsheet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="border border-ink/20 bg-card">
                <div className="border-b border-ink/20 bg-[#eef2e8] px-5 py-3">
                  <p className="micro text-muted-foreground">Certificate fields</p>
                </div>
                <div className="p-5">
                  {placeholders.length === 0 ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      No fields to fill. You can still generate a static copy of the template.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {placeholders.map((placeholder) => (
                        <div key={placeholder} className="space-y-2">
                          <Label htmlFor={`field-${placeholder}`}>{`{${placeholder}}`}</Label>
                          <Input
                            id={`field-${placeholder}`}
                            value={values[placeholder] ?? ""}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [placeholder]: e.target.value }))
                            }
                            placeholder={`Value for ${placeholder}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 border-t border-ink/15 pt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="includeQr"
                        checked={includeQr}
                        onCheckedChange={(checked) => setIncludeQr(Boolean(checked))}
                        className="mt-0.5"
                      />
                      <div>
                        <Label
                          htmlFor="includeQr"
                          className="cursor-pointer !text-xs !normal-case !tracking-normal !text-foreground"
                        >
                          Add a verification QR code
                        </Label>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Embeds a unique link to a public record page. Only the recipient, template
                          name, and issue date are shown.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generateOne}
                    disabled={loading}
                    className="mt-5 w-full gap-2"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {loading ? "Rendering…" : "Generate certificate"}
                  </Button>
                </div>
              </div>

              <div className="border border-ink/20 bg-[#eef2e8]">
                <div className="flex items-center justify-between gap-3 border-b border-ink/20 bg-card px-5 py-3">
                  <p className="micro text-muted-foreground">Output preview</p>
                  {preview && (
                    <a
                      href={preview}
                      download={`${template.name.replace(/[^\w-]+/g, "_")}.png`}
                      className="inline-flex items-center gap-1.5 border border-ink px-2.5 py-1.5 text-xs font-medium transition hover:bg-ink hover:text-primary-foreground"
                    >
                      <Download className="h-3 w-3" aria-hidden /> Download PNG
                    </a>
                  )}
                </div>
                <div className="flex min-h-[360px] items-center justify-center p-5">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Generated certificate preview for ${template.name}`}
                      className="max-h-[62vh] w-auto border border-ink/20 shadow-[0_20px_50px_-24px_rgb(18_37_29/45%)]"
                    />
                  ) : (
                    <div className="max-w-xs text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center border border-dashed border-ink/30">
                        <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden />
                      </div>
                      <p className="mt-4 font-display text-xl tracking-tight">
                        Nothing rendered yet
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Fill the fields and choose Generate. The exact PNG that gets downloaded
                        appears here.
                      </p>
                    </div>
                  )}
                </div>
                {preview && (
                  <div className="flex items-center gap-2 border-t border-ink/20 bg-card px-5 py-2.5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                    <Check className="h-3 w-3 text-valid" aria-hidden />
                    Saved to history · re-download any time
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="border border-ink/20 bg-card">
                <div className="border-b border-ink/20 bg-[#eef2e8] px-5 py-3">
                  <p className="micro text-muted-foreground">Spreadsheet upload</p>
                </div>
                <div className="p-5">
                  <label
                    htmlFor="bulk-file"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      pickBulkFile(e.dataTransfer.files?.[0] ?? null);
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors ${
                      dragActive
                        ? "border-accent bg-accent/[0.06]"
                        : "border-ink/35 bg-[#fbf8ef] hover:border-ink/60"
                    }`}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
                    <span className="mt-3 text-sm font-medium">
                      {bulkFile ? "Choose a different file" : "Drop a CSV or XLSX here"}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      or click to browse · max {MAX_BULK_ROWS} rows
                    </span>
                    <input
                      id="bulk-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="sr-only"
                      onChange={(e) => pickBulkFile(e.target.files?.[0] ?? null)}
                    />
                  </label>

                  {bulkFile && (
                    <div className="mt-4 flex items-center gap-3 border border-ink/20 bg-[#eef2e8] px-3 py-2.5">
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-ink/60" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{bulkFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(bulkFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkFile(null)}
                        className="grid h-7 w-7 place-items-center text-muted-foreground transition hover:text-foreground"
                        aria-label="Remove selected file"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )}

                  <Button
                    className="mt-5 w-full gap-2"
                    size="lg"
                    onClick={generateBulk}
                    disabled={!bulkFile || bulkLoading}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    {bulkLoading ? "Rendering batch…" : "Generate and download ZIP"}
                  </Button>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Keep this tab open while the batch renders. The finished ZIP is also recorded in
                    your history.
                  </p>
                </div>
              </div>

              <div className="border border-ink/20 bg-[#eef2e8] p-5">
                <p className="micro text-muted-foreground">Column checklist</p>
                <div className="mt-3 border border-dashed border-ink/30 bg-card p-4">
                  <p className="text-sm font-medium">Your first row should be:</p>
                  <code className="mt-2 block break-words font-mono text-xs leading-relaxed text-foreground/80">
                    {(placeholders.length > 0 ? placeholders : ["name", "course", "date"]).join(
                      ", ",
                    )}
                  </code>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium underline decoration-accent decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    <Download className="h-3 w-3" aria-hidden /> Download a starter CSV
                  </button>
                </div>

                <ul className="mt-5 space-y-3 border-t border-ink/20 pt-4 text-xs leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-valid" aria-hidden />
                    Column headings must match the placeholder names exactly.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-valid" aria-hidden />
                    One row produces one PNG. Blank cells render as empty text.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-valid" aria-hidden />
                    Files are named after the name column, with a unique suffix.
                  </li>
                </ul>

                <div className="mt-5 border-t border-ink/20 pt-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <QrCode className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Verification QR codes are available on individual certificates, not batch
                    output.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-ink/20 pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            Need to change a placement? Edits in the editor apply to future generations.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4"
          >
            Open generation history <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </SitePage>
  );
}
