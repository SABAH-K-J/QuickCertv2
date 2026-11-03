import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ImageIcon, LayoutTemplate, Plus, Sparkles, Trash2 } from "lucide-react";
import { SitePage } from "@/components/site/SitePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, assetUrl, type TemplateResponse } from "@/lib/api";
import { pageHead } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  head: () =>
    pageHead({
      title: "Templates — QuickCert",
      description: "Your certificate templates.",
      path: "/templates",
      noindex: true,
    }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: api.listTemplates,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateResponse | null>(null);
  const [fileName, setFileName] = useState("");

  const createMut = useMutation({
    mutationFn: (form: FormData) => api.createTemplate(form),
    onSuccess: (template) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setCreateOpen(false);
      setFileName("");
      toast.success("Template created");
      navigate({ to: "/editor/$id", params: { id: String(template.id) } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => api.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setDeleteTarget(null);
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SitePage>
      <div className="mx-auto max-w-[1240px] px-6 py-10 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-ink pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="micro flex items-center gap-3 text-muted-foreground">
              <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
              Template vault · {templates.length} {templates.length === 1 ? "design" : "designs"}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
              Templates
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Each template is one background image and the elements placed on it. Open a template
              to edit, or go straight to a batch.
            </p>
          </div>
          <Button size="lg" className="shrink-0 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New template
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 flex flex-col gap-3 border border-destructive/40 bg-destructive/[0.06] p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span>Could not load templates. Check that the backend is running.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-ink/15 bg-card">
                <div className="aspect-[16/10] bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 bg-muted" />
                  <div className="h-3 w-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && templates.length > 0 && (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <li
                key={template.id}
                className="group relative flex flex-col border border-ink/20 bg-card transition-colors hover:border-ink/50"
              >
                <div className="flex items-center justify-between border-b border-ink/15 px-4 py-2.5">
                  <span className="serial text-[0.5rem] text-muted-foreground">
                    T-{String(index + 1).padStart(3, "0")}
                  </span>
                  <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {template.width && template.height
                      ? `${template.width} × ${template.height}`
                      : "Dimensions on upload"}
                  </span>
                </div>

                <Link
                  to="/editor/$id"
                  params={{ id: String(template.id) }}
                  className="relative block aspect-[16/10] overflow-hidden bg-[#e3e8dc]"
                >
                  {template.background_image ? (
                    <img
                      src={assetUrl(template.background_image)}
                      alt={`Background of ${template.name}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <span className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" aria-hidden />
                        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em]">
                          No background
                        </span>
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-ink px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Open editor
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-xl leading-tight tracking-tight">
                    {template.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
                    {template.description || "No description added."}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-ink/15 pt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/editor/$id" params={{ id: String(template.id) }}>
                        Edit
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="gap-1.5">
                      <Link to="/generate/$id" params={{ id: String(template.id) }}>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        Generate
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(template)}
                      aria-label={`Delete ${template.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && templates.length === 0 && !error && (
          <div className="mt-10 border border-dashed border-ink/30 bg-card/60 px-6 py-16 text-center">
            <LayoutTemplate className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-4 font-display text-2xl tracking-tight">No templates yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Start with the certificate background you already use. You can add text, placeholders,
              and images after it is uploaded.
            </p>
            <Button className="mt-5 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Create your first template
            </Button>
          </div>
        )}

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-ink/20 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Templates are private to your account. Background images keep their pixel dimensions,
            which becomes the canvas size in the editor.
          </p>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-accent decoration-1 underline-offset-4"
          >
            How templates work <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create template</DialogTitle>
            <DialogDescription>
              Upload the background you want every certificate to use. Its pixel dimensions become
              the canvas size.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMut.mutate(fd);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                name="name"
                required
                maxLength={120}
                placeholder="e.g. Community First Aid 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                name="description"
                maxLength={400}
                placeholder="What this certificate is for, or who receives it."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-file">Background image</Label>
              <Input
                id="template-file"
                name="file"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
              <p className="text-xs text-muted-foreground">
                {fileName || "PNG or JPG. Large images are fine; they become the canvas."}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending} className="gap-2">
                {createMut.isPending ? "Uploading…" : "Create and open editor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this template?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.name}” and its elements will be removed. Past generation records stay
              in your history, but the template cannot be opened again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Keep template
            </Button>
            <Button
              variant="destructive"
              disabled={delMut.isPending}
              onClick={() => deleteTarget && delMut.mutate(deleteTarget.id)}
            >
              {delMut.isPending ? "Deleting…" : "Delete template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SitePage>
  );
}
