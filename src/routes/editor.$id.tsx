import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Canvas as FabricCanvas, FabricObject, IText as FabricText } from "fabric";
import {
  api,
  assetUrl,
  type Alignment,
  type TemplateElementResponse,
  type TemplateResponse,
} from "@/lib/api";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Image as ImageIcon,
  ImageUp,
  Layers,
  Loader2,
  Minus,
  MousePointer2,
  Plus,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/editor/$id")({
  head: ({ params }) =>
    pageHead({
      title: `Editor — Template #${params.id} — QuickCert`,
      description: "Place text and image elements on your certificate canvas.",
      path: `/editor/${params.id}`,
      noindex: true,
    }),
  component: EditorPage,
});

// ── Types ───────────────────────────────────────────────────────────────────

type SaveStatus = "saved" | "dirty" | "saving" | "error";

type ActiveSnapshot = {
  id: number;
  kind: "text" | "image";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  alignment: Alignment;
  placeholderType: string | null;
  width: number;
  height: number;
};

type LayerDescriptor = {
  id: number;
  kind: "text" | "image";
  label: string;
  detail: string;
};

/** Fabric objects carry our database id and placeholder key at runtime. */
type FabricElement = FabricObject & {
  id?: number;
  placeholder_type?: string | null;
  isEditing?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: string;
  initDimensions?: () => void;
  getScaledWidth?: () => number;
};

type FabricProps = Partial<FabricElement> & {
  text?: string;
  placeholder_type?: string | null;
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

type MobilePanel = "elements" | "inspect" | "layers" | null;

// ── Constants & helpers ─────────────────────────────────────────────────────

const FONTS = [
  "Arial",
  "Times New Roman",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Nunito",
  "Poppins",
  "Oswald",
];

const SYSTEM_FONTS = new Set(["Arial", "Times New Roman"]);

const PLACEHOLDER_SUGGESTIONS = [
  "name",
  "date",
  "course",
  "organization",
  "title",
  "certificate_id",
];

const ALIGNMENT_OPTIONS: { value: Alignment; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "Align left", Icon: AlignLeft },
  { value: "center", label: "Align centre", Icon: AlignCenter },
  { value: "right", label: "Align right", Icon: AlignRight },
];

function normalisePlaceholderKey(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 31);
}

function isValidPlaceholderKey(key: string) {
  return /^[a-z][a-z0-9_]*$/.test(key);
}

function statusLabel(status: SaveStatus, lastSavedAt: Date | null) {
  switch (status) {
    case "saving":
      return "Saving changes…";
    case "dirty":
      return "Unsaved changes";
    case "error":
      return "Save failed";
    default:
      return lastSavedAt
        ? `Saved ${lastSavedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "All changes saved";
  }
}

/** Load a Google-hosted font used by a template element, then let Fabric measure it. */
async function ensureFont(family: string) {
  if (!family || SYSTEM_FONTS.has(family)) return;
  const slug = family.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const id = `qc-font-${slug}`;
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(
      /%20/g,
      "+",
    )}&display=swap`;
    document.head.appendChild(link);
  }
  try {
    await document.fonts.load(`16px "${family}"`);
  } catch {
    // The browser will fall back to a local face; generation does the same on the server.
  }
}

function readSnapshot(obj: FabricElement): ActiveSnapshot {
  return {
    id: Number(obj.id),
    kind: obj.type === "i-text" ? "text" : "image",
    text: obj.type === "i-text" ? String(obj.text ?? "") : "",
    fontSize: Math.round(Number(obj.fontSize) || 0),
    fontFamily: String(obj.fontFamily ?? "Arial"),
    fill: typeof obj.fill === "string" ? obj.fill : "#12251D",
    alignment: (obj.textAlign as Alignment) ?? "left",
    placeholderType: (obj.placeholder_type as string | null) ?? null,
    width: Math.round((Number(obj.width) || 0) * (Number(obj.scaleX) || 1)),
    height: Math.round((Number(obj.height) || 0) * (Number(obj.scaleY) || 1)),
  };
}

function describeLayer(obj: FabricElement): LayerDescriptor {
  if (obj.type === "i-text") {
    const placeholder = (obj.placeholder_type as string | null) ?? null;
    const raw = String(obj.text ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const label = placeholder
      ? `{${placeholder}}`
      : raw
        ? raw.length > 26
          ? `${raw.slice(0, 26)}…`
          : raw
        : "Empty text";
    return {
      id: Number(obj.id),
      kind: "text",
      label,
      detail: placeholder ? "Dynamic field" : "Static text",
    };
  }
  return {
    id: Number(obj.id),
    kind: "image",
    label: "Image element",
    detail: `${Math.round((Number(obj.width) || 0) * (Number(obj.scaleX) || 1))} × ${Math.round(
      (Number(obj.height) || 0) * (Number(obj.scaleY) || 1),
    )} px`,
  };
}

function objectControls() {
  return {
    borderColor: "#C4432D",
    borderScaleFactor: 1.5,
    cornerColor: "#F3F0E6",
    cornerStrokeColor: "#C4432D",
    cornerStyle: "rect" as const,
    cornerSize: 10,
    transparentCorners: false,
    padding: 4,
    lockRotation: true,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

function EditorPage() {
  const { id } = Route.useParams();
  const templateId = Number(id);

  const {
    data: template,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => api.getTemplate(templateId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <EditorStatus title="Preparing editor">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>Loading template…</span>
      </EditorStatus>
    );
  }

  if (error || !template) {
    return (
      <EditorStatus title="Template unavailable">
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          We could not load this template. Check that the backend is running, then try again.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
          <Button asChild>
            <Link to="/templates">Back to templates</Link>
          </Button>
        </div>
      </EditorStatus>
    );
  }

  return <Editor template={template} />;
}

function EditorStatus({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid h-[100dvh] place-items-center bg-background px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="grid h-10 w-10 place-items-center border border-ink bg-ink font-display text-sm font-semibold text-primary-foreground">
          QC
        </span>
        <h1 className="font-display text-2xl tracking-tight">{title}</h1>
        {children}
      </div>
    </div>
  );
}

// ── Editor shell ────────────────────────────────────────────────────────────

function Editor({ template }: { template: TemplateResponse }) {
  const queryClient = useQueryClient();
  const templateId = template.id;

  const [templateState, setTemplateState] = useState(template);
  const [backgroundVersion, setBackgroundVersion] = useState(0);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<ActiveSnapshot | null>(null);
  const [layers, setLayers] = useState<LayerDescriptor[]>([]);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [saveStatus, setSaveStatusState] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit");
  const [announcement, setAnnouncement] = useState("No element selected.");

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const fabricRef = useRef<typeof import("fabric") | null>(null);
  const activeObjRef = useRef<FabricElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const applyZoomRef = useRef<(value: number) => void>(() => {});
  const fitRef = useRef<() => void>(() => {});
  const zoomModeRef = useRef<"fit" | number>("fit");

  const tWidth = templateState.width || 1000;
  const tHeight = templateState.height || 700;

  // ── Autosave queue ───────────────────────────────────────────────────────
  const pendingRef = useRef<Map<number, Partial<TemplateElementResponse>>>(new Map());
  const saveTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const saveStatusRef = useRef<SaveStatus>("saved");

  const setSaveStatus = useCallback((next: SaveStatus) => {
    saveStatusRef.current = next;
    setSaveStatusState(next);
  }, []);

  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleFlushRef = useRef<(delay?: number) => void>(() => {});

  const flush = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (inFlightRef.current) return;

    const entries = Array.from(pendingRef.current.entries());
    if (entries.length === 0) {
      setSaveStatus("saved");
      return;
    }

    pendingRef.current.clear();
    inFlightRef.current = true;
    setSaveStatus("saving");

    try {
      await Promise.all(
        entries.map(([elementId, patch]) => api.updateElement(templateId, elementId, patch)),
      );
      setLastSavedAt(new Date());
      if (pendingRef.current.size > 0) {
        setSaveStatus("dirty");
        scheduleFlushRef.current();
      } else {
        setSaveStatus("saved");
      }
    } catch (err: unknown) {
      // Put failed patches back under any newer edits so retry is lossless.
      for (const [elementId, patch] of entries) {
        pendingRef.current.set(elementId, {
          ...patch,
          ...(pendingRef.current.get(elementId) ?? {}),
        });
      }
      setSaveStatus("error");
      toast.error(errorMessage(err, "Could not save the latest change."));
    } finally {
      inFlightRef.current = false;
    }
  }, [templateId, setSaveStatus]);

  flushRef.current = flush;

  const scheduleFlush = useCallback((delay = 700) => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushRef.current();
    }, delay);
  }, []);

  scheduleFlushRef.current = scheduleFlush;

  const queuePatch = useCallback(
    (elementId: number, patch: Partial<TemplateElementResponse>) => {
      pendingRef.current.set(elementId, {
        ...(pendingRef.current.get(elementId) ?? {}),
        ...patch,
      });
      setSaveStatus("dirty");
      scheduleFlush();
    },
    [scheduleFlush, setSaveStatus],
  );

  const queuePatchRef = useRef(queuePatch);
  queuePatchRef.current = queuePatch;

  const retrySave = useCallback(() => {
    if (pendingRef.current.size === 0) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("dirty");
    scheduleFlush(0);
  }, [scheduleFlush, setSaveStatus]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatusRef.current === "saved") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Leave the editor only after the debounce has fired, even if it is mid-edit.
  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (pending.size > 0) void flushRef.current();
    };
  }, []);

  // Keep local template in sync when the query is refreshed by another screen.
  useEffect(() => {
    setTemplateState(template);
  }, [template]);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const refreshActive = useCallback(() => {
    const obj = activeObjRef.current;
    if (!obj || !canvasRef.current?.getObjects().includes(obj)) {
      activeObjRef.current = null;
      setActive(null);
      return;
    }
    setActive(readSnapshot(obj));
  }, []);
  const refreshActiveRef = useRef(refreshActive);
  refreshActiveRef.current = refreshActive;

  const syncLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setLayers([]);
      return;
    }
    const next = (canvas.getObjects() as FabricElement[])
      .filter((obj) => obj.id != null)
      .map((obj) => describeLayer(obj))
      .reverse();
    setLayers(next);
  }, []);
  const syncLayersRef = useRef(syncLayers);
  syncLayersRef.current = syncLayers;

  const deleteElementById = useCallback(
    async (elementId: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = (canvas.getObjects() as FabricElement[]).find((o) => o.id === elementId);
      if (!obj) return;

      try {
        // Save any pending edits before removing the record.
        await flushRef.current();
        await api.deleteElement(templateId, elementId);
        pendingRef.current.delete(elementId);
        canvas.remove(obj);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        if (activeObjRef.current === obj) {
          activeObjRef.current = null;
          setActive(null);
          setAnnouncement("Element deleted. No element selected.");
        }
        syncLayers();
        toast.success("Element removed");
      } catch (err: unknown) {
        toast.error(errorMessage(err, "Could not delete the element."));
      }
    },
    [templateId, syncLayers],
  );
  const deleteElementRef = useRef(deleteElementById);
  deleteElementRef.current = deleteElementById;

  const deleteActive = useCallback(() => {
    const obj = activeObjRef.current;
    if (obj?.id != null) void deleteElementById(obj.id);
  }, [deleteElementById]);
  const deleteActiveRef = useRef(deleteActive);
  deleteActiveRef.current = deleteActive;

  const selectLayer = useCallback((elementId: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = (canvas.getObjects() as FabricElement[]).find((o) => o.id === elementId);
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    activeObjRef.current = obj;
    setActive(readSnapshot(obj));
    setAnnouncement(`${obj.type === "i-text" ? "Text" : "Image"} element selected.`);
    setMobilePanel(null);
  }, []);

  // ── Fabric initialisation ────────────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let canvas: FabricCanvas | null = null;
    let board: FabricCanvas;
    let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

    (async () => {
      const fabric: typeof import("fabric") = await import("fabric");
      if (disposed || !canvasContainerRef.current) return;

      fabricRef.current = fabric;
      const container = canvasContainerRef.current;
      container.innerHTML = "";

      const canvasEl = document.createElement("canvas");
      container.appendChild(canvasEl);

      board = new fabric.Canvas(canvasEl, {
        width: tWidth,
        height: tHeight,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        selection: true,
        controlsAboveOverlay: true,
        stopContextMenu: true,
      });
      canvas = board;
      canvasRef.current = board;

      try {
        document.fonts.ready.catch(() => undefined);
        board.upperCanvasEl.tabIndex = 0;
        board.upperCanvasEl.setAttribute("role", "application");
        board.upperCanvasEl.setAttribute(
          "aria-label",
          "Certificate canvas. Select an element with the Layers panel, then use the arrow keys to nudge it.",
        );
      } catch {
        // Fabric internals differ between minor releases; keyboard access still works.
      }

      // ── Background ──────────────────────────────────────────────────────
      if (templateState.background_image) {
        try {
          const bg = await fabric.Image.fromURL(
            `${assetUrl(templateState.background_image)}?v=${backgroundVersion}`,
            { crossOrigin: "anonymous" },
          );
          if (disposed) return;
          bg.set({
            originX: "left",
            originY: "top",
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            hoverCursor: "default",
          });
          bg.scaleX = tWidth / (Number(bg.width) || tWidth);
          bg.scaleY = tHeight / (Number(bg.height) || tHeight);
          canvas.add(bg);
          try {
            canvas.sendObjectToBack(bg);
          } catch {
            canvas.moveObjectTo?.(bg, 0);
          }
        } catch (err) {
          console.error("Background load failed:", err);
          toast.error("The background image could not be previewed.");
        }
      }

      // ── Existing elements ───────────────────────────────────────────────
      try {
        const elements = await api.listElements(templateId);
        if (disposed) return;

        const families = new Set(
          elements
            .filter((el) => el.element_type === "text" && el.font_family)
            .map((el) => el.font_family as string),
        );
        await Promise.all(Array.from(families).map((family) => ensureFont(family)));
        if (disposed) return;

        for (const el of elements) {
          if (el.element_type === "text") {
            const alignment = (el.alignment as Alignment) || "left";
            const text = new fabric.IText(el.content ?? "", {
              ...objectControls(),
              left: el.x * tWidth,
              top: el.y * tHeight,
              fontSize: el.font_size ?? 40,
              fontFamily: el.font_family || "Arial",
              fill: el.color || "#000000",
              textAlign: alignment,
              originY: "top",
              originX: alignment === "center" ? "center" : alignment === "right" ? "right" : "left",
            }) as FabricText & FabricElement;
            text.set("id", el.id);
            text.placeholder_type = el.placeholder_type ?? null;
            text.setControlsVisibility?.({ mtr: false });
            canvas.add(text);
          } else if (el.element_type === "image" && el.image_path) {
            try {
              const img = await fabric.Image.fromURL(assetUrl(el.image_path), {
                crossOrigin: "anonymous",
              });
              if (disposed) return;
              img.set({
                ...objectControls(),
                originX: "left",
                originY: "top",
                left: el.x * tWidth,
                top: el.y * tHeight,
              });
              if (el.width && el.height) {
                img.scaleX = (el.width * tWidth) / (Number(img.width) || 1);
                img.scaleY = (el.height * tHeight) / (Number(img.height) || 1);
              }
              img.set("id", el.id);
              img.setControlsVisibility?.({ mtr: false });
              board.add(img);
            } catch (err) {
              console.error("Image element load failed:", err);
            }
          }
        }
        board.requestRenderAll();
      } catch (err) {
        console.error(err);
        toast.error("Some elements could not be loaded.");
      }

      // ── Zoom & fit ─────────────────────────────────────────────────────
      const applyZoom = (next: number) => {
        const clamped = Math.max(0.08, Math.min(2, next));
        board.setDimensions({
          width: Math.round(tWidth * clamped),
          height: Math.round(tHeight * clamped),
        });
        board.setZoom(clamped);
        board.requestRenderAll();
        setZoom(clamped);
      };

      const fit = () => {
        const el = wrapperRef.current;
        if (!el) return;
        const pad = window.innerWidth < 640 ? 32 : 64;
        const availableWidth = Math.max(0, el.clientWidth - pad);
        const availableHeight = Math.max(0, el.clientHeight - pad);
        if (!availableWidth || !availableHeight) return;
        applyZoom(Math.min(availableWidth / tWidth, availableHeight / tHeight, 1));
      };

      applyZoomRef.current = applyZoom;
      fitRef.current = fit;

      resizeObserver = new ResizeObserver(() => {
        if (zoomModeRef.current === "fit") fit();
      });
      if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
      fit();

      // ── Selection ──────────────────────────────────────────────────────
      const handleSelection = () => {
        const objects = board.getActiveObjects() as FabricElement[];
        const single = objects.length === 1 ? objects[0] : null;
        activeObjRef.current = single;
        setActive(single && single.id != null ? readSnapshot(single) : null);
        setAnnouncement(
          single && single.id != null
            ? `${single.type === "i-text" ? "Text" : "Image"} element selected.`
            : single
              ? "Multiple elements selected."
              : "No element selected.",
        );
      };

      board.on("selection:created", handleSelection);
      board.on("selection:updated", handleSelection);
      board.on("selection:cleared", handleSelection);

      // ── Saving ─────────────────────────────────────────────────────────
      const saveObject = (target: FabricElement | null | undefined) => {
        if (!target || target.id == null) return;

        let fontSize = Number(target.fontSize) || 40;
        if (
          target.type === "i-text" &&
          (Number(target.scaleX) !== 1 || Number(target.scaleY) !== 1)
        ) {
          fontSize = Math.max(4, Math.round(fontSize * (Number(target.scaleY) || 1)));
          target.set({ fontSize, scaleX: 1, scaleY: 1 });
          target.setCoords();
          board.requestRenderAll();
        }

        const patch: Partial<TemplateElementResponse> = {
          x: target.left / tWidth,
          y: target.top / tHeight,
        };

        if (target.type === "i-text") {
          patch.content = target.text ?? "";
          patch.font_size = fontSize;
          patch.color = typeof target.fill === "string" ? target.fill : "#000000";
        } else if (target.type === "image") {
          patch.width = (Number(target.width) * Number(target.scaleX)) / tWidth;
          patch.height = (Number(target.height) * Number(target.scaleY)) / tHeight;
        }

        queuePatchRef.current(target.id, patch);
        refreshActiveRef.current();
        syncLayersRef.current();
      };

      board.on("object:modified", (event) => saveObject(event.target as FabricElement));
      board.on("text:editing:exited", (event) => saveObject(event.target as FabricElement));
      board.on("text:changed", () => refreshActiveRef.current());
      board.on("object:added", () => syncLayersRef.current());
      board.on("object:removed", () => syncLayersRef.current());

      // ── Keyboard ───────────────────────────────────────────────────────
      keydownHandler = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const insideDialog = Boolean(target?.closest?.('[role="dialog"]'));
        const typingInField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.isContentEditable);

        const obj = board.getActiveObject() as FabricElement | undefined;
        const editing = Boolean(obj?.isEditing);

        if (editing) {
          if (event.key === "Escape") {
            (obj as FabricText).exitEditing();
            board.discardActiveObject();
            board.requestRenderAll();
          }
          return;
        }

        if (typingInField || insideDialog) return;

        if (event.key === "Escape") {
          board.discardActiveObject();
          board.requestRenderAll();
          return;
        }

        if (!obj || obj.id == null) return;

        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          deleteActiveRef.current();
          return;
        }

        const step = event.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (event.key === "ArrowLeft") dx = -step;
        else if (event.key === "ArrowRight") dx = step;
        else if (event.key === "ArrowUp") dy = -step;
        else if (event.key === "ArrowDown") dy = step;
        if (dx === 0 && dy === 0) return;

        event.preventDefault();
        obj.set({ left: (Number(obj.left) || 0) + dx, top: (Number(obj.top) || 0) + dy });
        obj.setCoords();
        board.requestRenderAll();
        queuePatchRef.current(obj.id, {
          x: (Number(obj.left) || 0) / tWidth,
          y: (Number(obj.top) || 0) / tHeight,
        });
        refreshActiveRef.current();
      };

      window.addEventListener("keydown", keydownHandler);

      if (!disposed) {
        setReady(true);
        syncLayersRef.current();
      }
    })().catch((err) => {
      console.error("Canvas setup failed:", err);
      if (!disposed) toast.error("The editor canvas could not be prepared.");
    });

    // Capture the container up front so the cleanup closure doesn't read a ref.
    const container = canvasContainerRef.current;
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
      try {
        board?.dispose();
      } catch {
        // Canvas may already be disposed during a fast background swap.
      }
      if (container) container.innerHTML = "";
      canvasRef.current = null;
      fabricRef.current = null;
      applyZoomRef.current = () => {};
      fitRef.current = () => {};
      activeObjRef.current = null;
      setActive(null);
      setLayers([]);
      setReady(false);
    };
    // The canvas is rebuilt when the backing sheet or its dimensions change.
  }, [templateId, templateState.background_image, backgroundVersion, tWidth, tHeight]);

  const setManualZoom = useCallback((value: number) => {
    const clamped = Math.max(0.08, Math.min(2, value));
    zoomModeRef.current = clamped;
    setZoomMode(clamped);
    applyZoomRef.current(clamped);
  }, []);

  const fitZoom = useCallback(() => {
    zoomModeRef.current = "fit";
    setZoomMode("fit");
    fitRef.current();
  }, []);

  // ── Element creation ────────────────────────────────────────────────────
  const addText = useCallback(
    async (placeholderKey: string | null) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;

      const content = placeholderKey ? `{${placeholderKey}}` : "New text";
      const fontSize = Math.max(18, Math.round(tWidth * 0.045));
      const x = 0.5;
      const y = 0.45;

      try {
        const created = await api.createElement(templateId, {
          element_type: "text",
          content,
          placeholder_type: placeholderKey,
          x,
          y,
          font_size: fontSize,
          font_family: "Times New Roman",
          color: "#12251D",
          alignment: "center",
        });

        const text = new fabric.IText(content, {
          ...objectControls(),
          left: x * tWidth,
          top: y * tHeight,
          fontSize,
          fontFamily: "Times New Roman",
          fill: "#12251D",
          textAlign: "center",
          originX: "center",
          originY: "top",
        }) as FabricText & FabricElement;
        text.set("id", created.id);
        text.placeholder_type = created.placeholder_type ?? null;
        text.setControlsVisibility?.({ mtr: false });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();

        activeObjRef.current = text;
        setActive(readSnapshot(text));
        setAnnouncement("Text element added and selected.");
        syncLayers();
        setMobilePanel(null);
      } catch (err: unknown) {
        toast.error(errorMessage(err, "Could not add the text element."));
      }
    },
    [templateId, tWidth, tHeight, syncLayers],
  );

  const addImage = useCallback(
    async (file: File) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      if (!canvas || !fabric) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Choose an image file (PNG, JPG, or WebP).");
        return;
      }

      try {
        const form = new FormData();
        form.append("file", file);
        const created = await api.uploadImageElement(templateId, form);

        const img = (await fabric.Image.fromURL(assetUrl(created.image_path!), {
          crossOrigin: "anonymous",
        })) as FabricElement;

        const sourceWidth = Number(img.width) || 1;
        const sourceHeight = Number(img.height) || 1;
        const maxWidth = tWidth * 0.32;
        const maxHeight = tHeight * 0.32;
        let drawWidth = Math.min(sourceWidth, maxWidth);
        let drawHeight = drawWidth * (sourceHeight / sourceWidth);
        if (drawHeight > maxHeight) {
          drawHeight = maxHeight;
          drawWidth = drawHeight * (sourceWidth / sourceHeight);
        }
        const left = (tWidth - drawWidth) / 2;
        const top = (tHeight - drawHeight) / 2;

        img.set({
          ...objectControls(),
          originX: "left",
          originY: "top",
          left,
          top,
          scaleX: drawWidth / sourceWidth,
          scaleY: drawHeight / sourceHeight,
        });
        img.set("id", created.id);
        img.setControlsVisibility?.({ mtr: false });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();

        await api.updateElement(templateId, created.id, {
          x: left / tWidth,
          y: top / tHeight,
          width: drawWidth / tWidth,
          height: drawHeight / tHeight,
        });

        activeObjRef.current = img;
        setActive(readSnapshot(img));
        setAnnouncement("Image element added and selected.");
        syncLayers();
        setMobilePanel(null);
      } catch (err: unknown) {
        toast.error(errorMessage(err, "Could not add the image."));
      }
    },
    [templateId, tWidth, tHeight, syncLayers],
  );

  // ── Inspector actions ───────────────────────────────────────────────────
  const patchActive = useCallback(
    (props: FabricProps, patch: Partial<TemplateElementResponse>) => {
      const obj = activeObjRef.current;
      const canvas = canvasRef.current;
      if (!obj || obj.id == null || !canvas) return;

      obj.set(props);
      if (obj.type === "i-text") obj.initDimensions?.();
      obj.setCoords?.();
      canvas.requestRenderAll();
      queuePatch(obj.id, patch);
      setActive(readSnapshot(obj));
    },
    [queuePatch],
  );

  const changeFont = useCallback(
    async (family: string) => {
      const obj = activeObjRef.current;
      if (!obj) return;
      await ensureFont(family);
      if (activeObjRef.current !== obj) return;
      patchActive({ fontFamily: family }, { font_family: family });
      syncLayers();
    },
    [patchActive, syncLayers],
  );

  const changeAlignment = useCallback(
    (next: Alignment) => {
      const obj = activeObjRef.current;
      const canvas = canvasRef.current;
      if (!obj || obj.id == null || !canvas) return;

      // Fabric stores `left` at the origin point. Capture the visual left edge
      // before moving the origin so the text does not jump on screen.
      const scaledWidth = Number(obj.getScaledWidth?.() ?? 0);
      const currentOrigin = String(obj.originX ?? "left");
      let visualLeft = Number(obj.left) || 0;
      if (currentOrigin === "center") visualLeft -= scaledWidth / 2;
      else if (currentOrigin === "right") visualLeft -= scaledWidth;

      let newLeft = visualLeft;
      if (next === "center") newLeft = visualLeft + scaledWidth / 2;
      else if (next === "right") newLeft = visualLeft + scaledWidth;

      obj.set({ textAlign: next, originX: next, left: newLeft });
      obj.setCoords?.();
      canvas.requestRenderAll();

      queuePatch(obj.id, { alignment: next, x: newLeft / tWidth });
      setActive(readSnapshot(obj));
      syncLayers();
    },
    [queuePatch, tWidth, syncLayers],
  );

  const changePlaceholder = useCallback(
    (rawKey: string | null) => {
      const obj = activeObjRef.current;
      const canvas = canvasRef.current;
      if (!obj || obj.id == null || !canvas) return;

      const key = rawKey ? normalisePlaceholderKey(rawKey) : null;
      const previous = (obj.placeholder_type as string | null) ?? null;
      const props: FabricProps = { placeholder_type: key };
      const patch: Partial<TemplateElementResponse> = { placeholder_type: key };
      const currentText = String(obj.text ?? "");

      if (key) {
        props.text = `{${key}}`;
        patch.content = props.text;
      } else if (previous && currentText === `{${previous}}`) {
        props.text = "Sample text";
        patch.content = props.text;
      }

      obj.set(props);
      obj.initDimensions?.();
      obj.setCoords?.();
      canvas.requestRenderAll();
      queuePatch(obj.id, patch);
      setActive(readSnapshot(obj));
      syncLayers();
    },
    [queuePatch, syncLayers],
  );

  // ── Background replacement ──────────────────────────────────────────────
  const replaceBackground = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Choose an image file (PNG, JPG, or WebP).");
        return;
      }
      setBackgroundBusy(true);
      try {
        await flushRef.current();
        const form = new FormData();
        form.append("file", file);
        const updated = await api.updateBackground(templateId, form);

        queryClient.setQueryData(["template", templateId], updated);
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        setTemplateState(updated);
        setBackgroundVersion((version) => version + 1);
        toast.success("Background replaced. Elements keep their relative positions.");
      } catch (err: unknown) {
        toast.error(errorMessage(err, "Could not replace the background."));
      } finally {
        setBackgroundBusy(false);
        if (backgroundInputRef.current) backgroundInputRef.current.value = "";
      }
    },
    [queryClient, templateId],
  );

  // ── Render ──────────────────────────────────────────────────────────────
  const panelTitle =
    mobilePanel === "elements" ? "Elements" : mobilePanel === "layers" ? "Layers" : "Inspector";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {/* Top rail */}
      <header className="relative z-20 shrink-0 border-b border-ink/20 bg-background">
        <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <Link
            to="/templates"
            aria-label="Back to templates"
            className="grid h-9 w-9 shrink-0 place-items-center border border-ink/30 text-foreground transition-colors hover:border-ink hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="micro hidden shrink-0 text-muted-foreground sm:inline">Editor</span>
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {templateState.name}
              </h1>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={retrySave} />
              <span className="hidden font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
                · {tWidth} × {tHeight} px · {layers.length}{" "}
                {layers.length === 1 ? "element" : "elements"}
              </span>
            </div>
          </div>

          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link
              to="/generate/$id"
              params={{ id: String(templateId) }}
              aria-label="Generate certificates from this template"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Generate</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Work area */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[236px_minmax(0,1fr)_320px]">
        <aside className="hidden min-h-0 flex-col border-r border-ink/15 bg-sidebar lg:flex">
          <div className="flex items-center justify-between border-b border-ink/15 px-4 py-3">
            <p className="micro text-muted-foreground">Elements</p>
            <span className="serial text-[0.5rem] text-muted-foreground">
              {layers.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ElementsPanel
              ready={ready}
              width={tWidth}
              height={tHeight}
              elementCount={layers.length}
              backgroundBusy={backgroundBusy}
              onAddText={addText}
              onAddImage={addImage}
              onPickBackground={() => backgroundInputRef.current?.click()}
            />
          </div>
        </aside>

        <main
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
          aria-busy={!ready}
        >
          <div className="press-ground absolute inset-0" aria-hidden />

          <div
            ref={wrapperRef}
            className={cn(
              "relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-6",
              !ready && "invisible",
            )}
          >
            <div className="paper-sheet relative max-h-full max-w-full">
              <div ref={canvasContainerRef} className="relative bg-white" />
            </div>
          </div>

          {!ready && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-background/60">
              <p className="flex items-center gap-2 border border-ink/25 bg-card px-4 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Preparing canvas
              </p>
            </div>
          )}

          {ready && layers.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4">
              <div className="pointer-events-auto max-w-sm border border-ink/25 bg-card/95 p-6 text-center shadow-[0_18px_50px_-24px_rgb(18_37_29/45%)]">
                <MousePointer2 className="mx-auto h-6 w-6 text-accent" aria-hidden />
                <h2 className="mt-3 font-display text-2xl tracking-tight">Start with a field</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Add the recipient name first. Placeholders become spreadsheet columns when you
                  generate a batch.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => void addText("name")}>
                    Add {"{name}"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void addText(null)}>
                    Add static text
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Floating tool rail */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            <ZoomControls
              zoom={zoom}
              mode={zoomMode}
              onFit={fitZoom}
              onReset={() => setManualZoom(1)}
              onIn={() => setManualZoom(zoom + 0.1)}
              onOut={() => setManualZoom(zoom - 0.1)}
            />
          </div>

          <p className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-[18rem] font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground xl:block">
            Double-click text to edit · Drag to move · Delete removes · Arrows nudge
          </p>
        </main>

        <aside className="hidden min-h-0 flex-col border-l border-ink/15 bg-sidebar lg:flex">
          <Tabs defaultValue="inspect" className="flex h-full min-h-0 flex-col">
            <div className="border-b border-ink/15 px-4 pt-1">
              <TabsList>
                <TabsTrigger value="inspect">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  Inspect
                </TabsTrigger>
                <TabsTrigger value="layers">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  Layers
                  <span className="serial text-[0.5rem] text-muted-foreground">
                    {layers.length.toString().padStart(2, "0")}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="inspect" className="min-h-0 flex-1 overflow-y-auto">
              <InspectorPanel
                active={active}
                onPatch={patchActive}
                onFont={changeFont}
                onAlignment={changeAlignment}
                onPlaceholder={changePlaceholder}
                onDelete={deleteActive}
              />
            </TabsContent>
            <TabsContent value="layers" className="min-h-0 flex-1 overflow-y-auto">
              <LayersPanel
                layers={layers}
                activeId={active?.id ?? null}
                onSelect={selectLayer}
                onDelete={(elementId) => void deleteElementById(elementId)}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Mobile panel rail */}
      <nav
        aria-label="Editor panels"
        className="grid shrink-0 grid-cols-3 border-t border-ink/20 bg-card lg:hidden"
      >
        <PanelButton icon={Plus} label="Elements" onClick={() => setMobilePanel("elements")} />
        <PanelButton
          icon={SlidersHorizontal}
          label="Inspect"
          active={Boolean(active)}
          onClick={() => setMobilePanel("inspect")}
        />
        <PanelButton
          icon={Layers}
          label="Layers"
          badge={layers.length}
          onClick={() => setMobilePanel("layers")}
        />
      </nav>

      <Dialog
        open={mobilePanel !== null}
        onOpenChange={(open) => {
          if (!open) setMobilePanel(null);
        }}
      >
        <DialogContent className="bottom-0 left-0 top-auto max-h-[78dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto border-x-0 border-b-0 p-0">
          <DialogHeader className="sticky top-0 z-10 border-b border-ink/15 bg-card px-5 py-4">
            <p className="micro text-muted-foreground">Workspace</p>
            <DialogTitle className="text-xl">{panelTitle}</DialogTitle>
            <DialogDescription>
              {mobilePanel === "elements"
                ? "Add text fields, images, or a new background sheet."
                : mobilePanel === "layers"
                  ? "Every element on this certificate, topmost first."
                  : active
                    ? "Edit the selected element."
                    : "Select an element on the canvas or in Layers."}
            </DialogDescription>
          </DialogHeader>

          {mobilePanel === "elements" && (
            <ElementsPanel
              ready={ready}
              width={tWidth}
              height={tHeight}
              elementCount={layers.length}
              backgroundBusy={backgroundBusy}
              onAddText={addText}
              onAddImage={addImage}
              onPickBackground={() => backgroundInputRef.current?.click()}
            />
          )}

          {mobilePanel === "inspect" && (
            <InspectorPanel
              active={active}
              onPatch={patchActive}
              onFont={changeFont}
              onAlignment={changeAlignment}
              onPlaceholder={changePlaceholder}
              onDelete={() => {
                deleteActive();
                setMobilePanel(null);
              }}
            />
          )}

          {mobilePanel === "layers" && (
            <LayersPanel
              layers={layers}
              activeId={active?.id ?? null}
              onSelect={selectLayer}
              onDelete={(elementId) => void deleteElementById(elementId)}
            />
          )}
        </DialogContent>
      </Dialog>

      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceBackground(file);
        }}
      />
    </div>
  );
}

// ── Save indicator ──────────────────────────────────────────────────────────

function SaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  onRetry: () => void;
}) {
  const tone =
    status === "saved"
      ? "bg-valid"
      : status === "error"
        ? "bg-destructive"
        : status === "dirty"
          ? "bg-accent"
          : "bg-steel";

  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 shrink-0", tone, status === "saving" && "animate-pulse")}
      />
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "font-mono text-[0.5rem] uppercase tracking-[0.14em]",
          status === "error" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {statusLabel(status, lastSavedAt)}
      </span>
      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-foreground underline decoration-accent underline-offset-2"
        >
          Retry
        </button>
      )}
    </span>
  );
}

// ── Zoom controls ───────────────────────────────────────────────────────────

function ZoomControls({
  zoom,
  mode,
  onFit,
  onReset,
  onIn,
  onOut,
}: {
  zoom: number;
  mode: "fit" | number;
  onFit: () => void;
  onReset: () => void;
  onIn: () => void;
  onOut: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Canvas zoom"
      className="flex h-9 items-stretch border border-ink/30 bg-card text-foreground shadow-[0_1px_0_rgb(18_37_29/8%)]"
    >
      <button
        type="button"
        onClick={onOut}
        aria-label="Zoom out"
        className="grid w-8 place-items-center border-r border-ink/15 transition-colors hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="Zoom to 100 percent"
        className="min-w-[3.25rem] px-1 font-mono text-[0.5625rem] tabular-nums tracking-[0.1em] transition-colors hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onIn}
        aria-label="Zoom in"
        className="grid w-8 place-items-center border-l border-ink/15 transition-colors hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onFit}
        aria-label="Fit canvas to the available space"
        aria-pressed={mode === "fit"}
        className={cn(
          "border-l border-ink/15 px-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] transition-colors hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          mode === "fit" && "bg-ink text-primary-foreground hover:bg-ink",
        )}
      >
        Fit
      </button>
    </div>
  );
}

// ── Elements panel ──────────────────────────────────────────────────────────

function ElementsPanel({
  ready,
  width,
  height,
  elementCount,
  backgroundBusy,
  onAddText,
  onAddImage,
  onPickBackground,
}: {
  ready: boolean;
  width: number;
  height: number;
  elementCount: number;
  backgroundBusy: boolean;
  onAddText: (key: string | null) => void;
  onAddImage: (file: File) => void;
  onPickBackground: () => void;
}) {
  const [customKey, setCustomKey] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  function submitCustom(event: FormEvent) {
    event.preventDefault();
    const key = normalisePlaceholderKey(customKey);
    if (!key) {
      setCustomError("Enter a column name, for example student_id.");
      return;
    }
    if (!isValidPlaceholderKey(key)) {
      setCustomError("Start with a letter. Use letters, numbers, or underscores.");
      return;
    }
    setCustomError(null);
    setCustomKey("");
    onAddText(key);
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="micro mb-2.5 text-muted-foreground">Add text</p>
        <div className="space-y-1">
          <AddButton
            icon={Type}
            label="Static text"
            hint="Prints exactly as typed"
            disabled={!ready}
            onClick={() => onAddText(null)}
          />
          <AddButton
            icon={User}
            label="Recipient name"
            hint="{name}"
            disabled={!ready}
            onClick={() => onAddText("name")}
          />
          <AddButton
            icon={Calendar}
            label="Issue date"
            hint="{date}"
            disabled={!ready}
            onClick={() => onAddText("date")}
          />
          <AddButton
            icon={GraduationCap}
            label="Course or title"
            hint="{course}"
            disabled={!ready}
            onClick={() => onAddText("course")}
          />
        </div>
      </div>

      <form onSubmit={submitCustom} className="space-y-2 border-t border-ink/15 pt-4">
        <Label htmlFor="custom-placeholder" className="field-label">
          Custom field
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="custom-placeholder"
            value={customKey}
            onChange={(event) => {
              setCustomKey(event.target.value);
              setCustomError(null);
            }}
            placeholder="student_id"
            className="h-9 min-w-0 font-mono text-xs"
            disabled={!ready}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(customError)}
            aria-describedby={customError ? "custom-placeholder-error" : undefined}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-9 shrink-0 px-2.5"
            disabled={!ready}
            aria-label="Add custom field"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        {customError ? (
          <p id="custom-placeholder-error" className="text-xs leading-relaxed text-destructive">
            {customError}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Becomes a column in your CSV. Add it to the template as{" "}
            <code className="font-mono text-[0.7rem]">{`{key}`}</code>.
          </p>
        )}
      </form>

      <div className="border-t border-ink/15 pt-4">
        <p className="micro mb-2.5 text-muted-foreground">Add image</p>
        <label
          className={cn(
            "flex cursor-pointer items-center gap-2.5 border border-dashed border-ink/30 bg-card px-3 py-2.5 text-sm transition-colors hover:border-ink/60 hover:bg-ink/[0.04]",
            !ready && "pointer-events-none opacity-50",
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={!ready}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAddImage(file);
              event.currentTarget.value = "";
            }}
          />
          <ImageUp className="h-4 w-4 text-accent" aria-hidden />
          <span>Upload logo or seal</span>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          PNG keeps transparency. White backgrounds are removed in generated files.
        </p>
      </div>

      <div className="border-t border-ink/15 pt-4">
        <p className="micro mb-2.5 text-muted-foreground">Canvas sheet</p>
        <dl className="grid grid-cols-2 gap-2 border border-ink/15 bg-card p-3">
          <div>
            <dt className="field-label">Width</dt>
            <dd className="serial mt-0.5 text-xs text-foreground">{width} px</dd>
          </div>
          <div>
            <dt className="field-label">Height</dt>
            <dd className="serial mt-0.5 text-xs text-foreground">{height} px</dd>
          </div>
          <div className="col-span-2 border-t border-ink/10 pt-2">
            <dt className="field-label">Elements</dt>
            <dd className="serial mt-0.5 text-xs text-foreground">
              {elementCount.toString().padStart(2, "0")}
            </dd>
          </div>
        </dl>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full justify-start gap-2"
          disabled={backgroundBusy}
          onClick={onPickBackground}
        >
          {backgroundBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImageIcon className="h-4 w-4" aria-hidden />
          )}
          {backgroundBusy ? "Replacing…" : "Replace background"}
        </Button>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          A new sheet changes the canvas to the image's pixel dimensions. Elements keep their
          relative positions.
        </p>
      </div>
    </div>
  );
}

function AddButton({
  icon: Icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: typeof Type;
  label: string;
  hint: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-2.5 border border-transparent px-2 py-2 text-left transition-colors hover:border-ink/20 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center border border-ink/20 bg-card text-ink transition-colors group-hover:border-ink/50">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight">{label}</span>
        <span className="mt-0.5 block font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}

// ── Inspector panel ─────────────────────────────────────────────────────────

function InspectorPanel({
  active,
  onPatch,
  onFont,
  onAlignment,
  onPlaceholder,
  onDelete,
}: {
  active: ActiveSnapshot | null;
  onPatch: (props: FabricProps, patch: Partial<TemplateElementResponse>) => void;
  onFont: (family: string) => void;
  onAlignment: (alignment: Alignment) => void;
  onPlaceholder: (key: string | null) => void;
  onDelete: () => void;
}) {
  if (!active) {
    return (
      <div className="p-5">
        <div className="border border-dashed border-ink/25 bg-card/60 px-5 py-8 text-center">
          <MousePointer2 className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium">No element selected</p>
          <p className="mx-auto mt-1.5 max-w-[15rem] text-xs leading-relaxed text-muted-foreground">
            Select an element on the canvas, or pick one from the Layers tab.
          </p>
        </div>
        <div className="mt-5 space-y-2">
          <p className="micro text-muted-foreground">Keyboard</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex justify-between gap-3 border-b border-ink/10 pb-1.5">
              <span>Nudge element</span>
              <kbd className="font-mono text-[0.625rem] text-foreground">↑ ↓ ← →</kbd>
            </li>
            <li className="flex justify-between gap-3 border-b border-ink/10 pb-1.5">
              <span>Nudge by 10 px</span>
              <kbd className="font-mono text-[0.625rem] text-foreground">Shift + arrows</kbd>
            </li>
            <li className="flex justify-between gap-3 border-b border-ink/10 pb-1.5">
              <span>Remove element</span>
              <kbd className="font-mono text-[0.625rem] text-foreground">Delete</kbd>
            </li>
            <li className="flex justify-between gap-3">
              <span>Deselect or exit text</span>
              <kbd className="font-mono text-[0.625rem] text-foreground">Esc</kbd>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (active.kind === "image") {
    return (
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between border-b border-ink/15 pb-3">
          <span className="inline-flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Image element
          </span>
          <span className="serial text-[0.5rem] text-muted-foreground">
            E-{String(active.id).padStart(3, "0")}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <div className="border border-ink/15 bg-card p-3">
            <dt className="field-label">Width</dt>
            <dd className="serial mt-1 text-xs">{active.width} px</dd>
          </div>
          <div className="border border-ink/15 bg-card p-3">
            <dt className="field-label">Height</dt>
            <dd className="serial mt-1 text-xs">{active.height} px</dd>
          </div>
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Drag the element to move it. Drag a corner to resize. Rotation is locked so the generated
          PNG matches the canvas. Use the zoom controls if the handles feel small.
        </p>

        <Button variant="destructive" className="w-full justify-start gap-2" onClick={onDelete}>
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete element
        </Button>
      </div>
    );
  }

  const fontOptions = Array.from(new Set([...FONTS, active.fontFamily]));

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between border-b border-ink/15 pb-3">
        <span className="inline-flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground">
          <Type className="h-3.5 w-3.5" aria-hidden />
          {active.placeholderType ? "Dynamic field" : "Text element"}
        </span>
        <span className="serial text-[0.5rem] text-muted-foreground">
          E-{String(active.id).padStart(3, "0")}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inspector-content" className="field-label">
          Preview text
        </Label>
        <Input
          id="inspector-content"
          value={active.text}
          onChange={(event) =>
            onPatch({ text: event.target.value }, { content: event.target.value })
          }
          spellCheck={false}
          className="font-mono text-xs"
        />
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {active.placeholderType
            ? "This is a preview. The generated file uses the matching spreadsheet column."
            : "This exact text is printed on every certificate."}
        </p>
      </div>

      <PlaceholderField
        key={`${active.id}-${active.placeholderType ?? "static"}`}
        value={active.placeholderType}
        onCommit={onPlaceholder}
      />

      <div className="space-y-2">
        <Label htmlFor="inspector-font" className="field-label">
          Typeface
        </Label>
        <Select value={active.fontFamily} onValueChange={onFont}>
          <SelectTrigger id="inspector-font">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-2">
          <Label htmlFor="inspector-size" className="field-label">
            Size
          </Label>
          <div className="relative">
            <Input
              id="inspector-size"
              type="number"
              inputMode="numeric"
              min={4}
              max={400}
              value={active.fontSize}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next) || next <= 0) return;
                const clamped = Math.max(4, Math.min(400, Math.round(next)));
                onPatch({ fontSize: clamped }, { font_size: clamped });
              }}
              className="pr-7 font-mono"
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground">
              px
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector-color" className="field-label">
            Ink
          </Label>
          <div className="flex h-10 items-stretch border border-input bg-[#fbf8ef] p-1">
            <input
              id="inspector-color"
              type="color"
              value={active.fill}
              onChange={(event) =>
                onPatch({ fill: event.target.value }, { color: event.target.value })
              }
              className="h-full w-9 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Text colour"
            />
            <span className="grid flex-1 place-items-center font-mono text-[0.5rem] uppercase tracking-[0.08em] text-muted-foreground">
              {active.fill}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="field-label">Alignment</span>
        <div
          role="group"
          aria-label="Text alignment"
          className="grid grid-cols-3 gap-1 border border-input bg-[#fbf8ef] p-1"
        >
          {ALIGNMENT_OPTIONS.map(({ value, label, Icon }) => {
            const selected = active.alignment === value;
            return (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => onAlignment(value)}
                className={cn(
                  "grid h-8 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  selected
                    ? "bg-ink text-primary-foreground"
                    : "text-muted-foreground hover:bg-ink/[0.06] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            );
          })}
        </div>
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          Alignment sets the anchor point. Changing it keeps the text where it appears on the
          canvas.
        </p>
      </div>

      <Button variant="destructive" className="w-full justify-start gap-2" onClick={onDelete}>
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete element
      </Button>
    </div>
  );
}

function PlaceholderField({
  value,
  onCommit,
}: {
  value: string | null;
  onCommit: (key: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);

  function commit(nextValue: string) {
    const key = normalisePlaceholderKey(nextValue);
    if (nextValue.trim() && !isValidPlaceholderKey(key)) {
      setError("Start with a letter, then letters, numbers, or underscores.");
      return;
    }
    setError(null);
    setDraft(key);
    onCommit(key || null);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="inspector-placeholder" className="field-label">
        Spreadsheet column
      </Label>
      <div className="flex gap-1.5">
        <Input
          id="inspector-placeholder"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              setDraft(value ?? "");
              setError(null);
            }
          }}
          placeholder="static text"
          list="placeholder-suggestions"
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-xs"
          aria-invalid={Boolean(error)}
          aria-describedby="placeholder-help"
        />
        <datalist id="placeholder-suggestions">
          {PLACEHOLDER_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <p
        id="placeholder-help"
        className={cn(
          "text-[0.6875rem] leading-relaxed",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ??
          (value
            ? `Live preview shows {${value}}. Leave empty to print fixed text.`
            : "Leave empty for fixed text. Type a column key such as name or student_id.")}
      </p>
    </div>
  );
}

// ── Layers panel ────────────────────────────────────────────────────────────

function LayersPanel({
  layers,
  activeId,
  onSelect,
  onDelete,
}: {
  layers: LayerDescriptor[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (layers.length === 0) {
    return (
      <div className="p-5">
        <div className="border border-dashed border-ink/25 bg-card/60 px-5 py-8 text-center">
          <Layers className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium">No layers yet</p>
          <p className="mx-auto mt-1.5 max-w-[15rem] text-xs leading-relaxed text-muted-foreground">
            Add a text field or image from the Elements panel. Layers appear here, topmost first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="micro text-muted-foreground">
          {layers.length} {layers.length === 1 ? "layer" : "layers"}
        </p>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
          Top first
        </span>
      </div>

      <ul className="space-y-1.5">
        {layers.map((layer) => {
          const selected = activeId === layer.id;
          const Icon = layer.kind === "text" ? Type : ImageIcon;
          return (
            <li
              key={layer.id}
              className={cn(
                "group flex items-stretch border bg-card transition-colors",
                selected ? "border-ink bg-secondary/50" : "border-ink/15 hover:border-ink/40",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(layer.id)}
                aria-current={selected ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    selected ? "text-accent" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm leading-tight">{layer.label}</span>
                  <span className="mt-0.5 block font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {layer.detail}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(layer.id)}
                aria-label={`Delete ${layer.label}`}
                className="grid w-9 shrink-0 place-items-center border-l border-ink/10 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-ink/15 pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Elements render in creation order, so the top layer prints last. Positions are stored as
        fractions of the sheet, which is why replacing a background keeps the layout proportional.
      </p>
    </div>
  );
}

// ── Mobile panel button ─────────────────────────────────────────────────────

function PanelButton({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  badge?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 flex-col items-center justify-center gap-1 border-r border-ink/10 text-muted-foreground transition-colors last:border-r-0 hover:bg-ink/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="relative">
        <Icon className="h-4 w-4" aria-hidden />
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2.5 -top-2 grid h-3.5 min-w-3.5 place-items-center bg-ink px-0.5 font-mono text-[0.4375rem] text-primary-foreground">
            {badge}
          </span>
        )}
        {active && !badge ? (
          <span aria-hidden className="absolute -right-1.5 -top-1 h-1.5 w-1.5 bg-accent" />
        ) : null}
      </span>
      <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em]">{label}</span>
    </button>
  );
}
