/**
 * App.jsx
 * -------
 * Root component for the QuickCert template editor.
 *
 * Responsibilities:
 *   - Sidebar: list templates, create / delete templates
 *   - Canvas: Fabric.js canvas initialisation, background image loading,
 *             element loading, responsive resizing, auto-save on drag/resize
 *   - Toolbar: add text (static / placeholder) and image elements
 *   - Properties panel: edit the selected element's font, color, alignment, etc.
 *
 * API calls go through the /api proxy (configured in vite.config.js) so the
 * base URL works identically in dev and production.
 */

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

/** Base URL prefix for all backend API calls — proxied by Vite in dev. */
const API_BASE = "/api";

function App() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);          // all templates from the API
  const [selectedTemplate, setSelectedTemplate] = useState(null); // currently open template
  const [fabricCanvas, setFabricCanvas] = useState(null);  // active Fabric.js Canvas instance
  const [activeObject, setActiveObject] = useState(null);  // currently selected canvas object
  const [, setRevision] = useState(0); // incremented to force React re-renders after Fabric mutations

  // ── Refs ────────────────────────────────────────────────────────────────────
  const canvasContainerRef = useRef(null); // DOM node that Fabric mounts its <canvas> into
  const wrapperRef = useRef(null);         // outer wrapper used for responsive scale calculation
  const saveTimeoutRef = useRef(null);     // debounce timer ref for property-panel saves

  // ── Template list handlers ───────────────────────────────────────────────────
  // Fetch templates when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates/`);
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch(`${API_BASE}/templates/`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchTemplates();
        e.target.reset();
      }
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await fetch(`${API_BASE}/templates/${id}`, { method: "DELETE" });
      if (selectedTemplate && selectedTemplate.id === id) {
        setSelectedTemplate(null);
      }
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  // ── Fabric.js canvas setup ───────────────────────────────────────────────────
  // Initialise (or re-initialise) the Fabric canvas whenever the selected template changes.
  // Cleanup disposes the previous canvas instance to prevent memory leaks.
  useEffect(() => {
    if (!selectedTemplate || !canvasContainerRef.current) return;

    // Isolate React from Fabric DOM manipulation by manually inserting the canvas
    canvasContainerRef.current.innerHTML = "";
    const canvasElement = document.createElement("canvas");
    canvasElement.id = "fabric-canvas";
    canvasContainerRef.current.appendChild(canvasElement);

    // Initialize Fabric Canvas
    const tWidth = selectedTemplate.width || 1000;
    const tHeight = selectedTemplate.height || 700;

    const canvas = new fabric.Canvas(canvasElement, {
      width: tWidth,
      height: tHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    setFabricCanvas(canvas);

    // Initialize background image if it exists
    if (selectedTemplate.background_image) {
      // Normalize slashes for Windows and ensure spaces/special chars are URL encoded
      const cleanPath = selectedTemplate.background_image.replace(/\\/g, "/");
      const bgUrl = `/${cleanPath}`;

      fabric.Image.fromURL(bgUrl, { crossOrigin: "anonymous" })
        .then((img) => {
          img.set({
            originX: "left",
            originY: "top",
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
          });
          // Since the canvas is now sized to match the actual image, we size it precisely
          img.scaleToWidth(tWidth);
          img.scaleToHeight(tHeight);
          canvas.add(img);
          img.sendToBack();
          canvas.renderAll();
        })
        .catch((err) => console.error("Failed loading background image:", err));
    }

    // Load template elements
    fetch(`${API_BASE}/templates/${selectedTemplate.id}/elements`)
      .then((res) => res.json())
      .then((eleData) => {
        eleData.forEach((el) => {
          if (el.element_type === "text") {
            const text = new fabric.IText(el.content, {
              left: el.x * tWidth,
              top: el.y * tHeight,
              fontSize: el.font_size,
              fontFamily: el.font_family || "Arial",
              fill: el.color || "#000000",
              textAlign: el.alignment || "left",
              originX:
                el.alignment === "center"
                  ? "center"
                  : el.alignment === "right"
                    ? "right"
                    : "left",
              // Force dimensions to be fully baked, ignoring previous scale
              scaleX: 1,
              scaleY: 1,
            });
            text.set("id", el.id);
            canvas.add(text);
          } else if (el.element_type === "image") {
            fabric.Image.fromURL(`/${el.image_path.replace(/\\/g, "/")}`, {
              crossOrigin: "anonymous",
            })
              .then((img) => {
                // Always anchor images by their top-left corner for consistency
                img.set({
                  originX: "left",
                  originY: "top",
                  left: el.x * tWidth,
                  top: el.y * tHeight,
                });
                if (el.width && el.height) {
                  img.scaleX = (el.width * tWidth) / img.width;
                  img.scaleY = (el.height * tHeight) / img.height;
                }
                img.set("id", el.id);
                canvas.add(img);
                canvas.renderAll();
              })
              .catch((err) =>
                console.error("Failed loading image element:", err),
              );
          }
        });
        canvas.renderAll();
      });

    // Handle Responsive resizing
    const resizeCanvas = () => {
      if (!wrapperRef.current || !canvas) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      // Allow padding
      const scale = Math.min(
        (clientWidth - 40) / tWidth,
        (clientHeight - 40) / tHeight,
      );
      const finalScale = Math.max(0.1, scale);

      canvas.setDimensions({
        width: tWidth * finalScale,
        height: tHeight * finalScale,
      });
      canvas.setZoom(finalScale);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    resizeCanvas(); // initial sizing

    // Auto-save element position/size/font whenever the user finishes moving or resizing.
    // For text, scale is baked into fontSize so the DB stores real pt values, not scale factors.
    const handleObjectModified = async (e) => {
      const target = e.target;
      if (!target || !target.id) return;

      // If object was scaled, bake it into font size directly
      let currentFontSize = target.fontSize || 40;
      if (
        target.type === "i-text" &&
        (target.scaleX !== 1 || target.scaleY !== 1)
      ) {
        currentFontSize = Math.round(target.fontSize * target.scaleY);
        target.set({
          fontSize: currentFontSize,
          scaleX: 1,
          scaleY: 1,
        });
        target.setCoords();
        canvas.renderAll();
        setRevision((r) => r + 1); // trigger properties panel re-render
      }

      const tWidth = selectedTemplate.width || 1000;
      const tHeight = selectedTemplate.height || 700;

      const payload = {
        x: target.left / tWidth,
        y: target.top / tHeight,
      };

      if (target.type === "i-text") {
        payload.content = target.text;
        payload.font_size = currentFontSize;
        payload.color = target.fill;
      } else if (target.type === "image") {
        payload.width = (target.width * target.scaleX) / tWidth;
        payload.height = (target.height * target.scaleY) / tHeight;
      }

      try {
        await fetch(
          `${API_BASE}/templates/${selectedTemplate.id}/elements/${target.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } catch (err) {
        console.error("Failed saving object position:", err);
      }
    };

    canvas.on("object:modified", handleObjectModified);

    // Set active object for properties panel
    const updateActiveObj = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 1) {
        setActiveObject(activeObjects[0]);
      } else {
        setActiveObject(null);
      }
    };

    canvas.on("selection:created", updateActiveObj);
    canvas.on("selection:updated", updateActiveObj);
    canvas.on("selection:cleared", updateActiveObj);
    canvas.on("object:modified", updateActiveObj);

    // Also mark canvas updates when typing directly on canvas
    canvas.on("text:changed", () => setRevision((r) => r + 1));

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      setActiveObject(null);
      setFabricCanvas(null);
    };
  }, [selectedTemplate]);

  // ── Element creation handlers ─────────────────────────────────────────────────
  const handleAddImageElement = async (e) => {
    if (!selectedTemplate || !fabricCanvas) return;

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${API_BASE}/templates/${selectedTemplate.id}/image-elements`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (res.ok) {
        const tWidth = selectedTemplate.width || 1000;
        const tHeight = selectedTemplate.height || 700;

        const el = await res.json();
        fabric.Image.fromURL(`/${el.image_path.replace(/\\/g, "/")}`, {
          crossOrigin: "anonymous",
        })
          .then(async (img) => {
            // Cap default width at 25% of canvas; keep aspect ratio
            const defaultW = Math.min(tWidth * 0.25, img.width);
            const aspectRatio = img.height / img.width;
            const defaultH = defaultW * aspectRatio;

            // Place the image at the center of the canvas
            const centerX = (tWidth - defaultW) / 2;
            const centerY = (tHeight - defaultH) / 2;

            img.set({
              originX: "left",
              originY: "top",
              left: centerX,
              top: centerY,
              scaleX: defaultW / img.width,
              scaleY: defaultH / img.height,
            });
            img.set("id", el.id);
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();

            // Save both position AND dimensions so the element is fully
            // correct in the DB even before the user drags it.
            try {
              await fetch(
                `${API_BASE}/templates/${selectedTemplate.id}/elements/${el.id}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    x: centerX / tWidth,
                    y: centerY / tHeight,
                    width: defaultW / tWidth,
                    height: defaultH / tHeight,
                  }),
                },
              );
            } catch (err) {
              console.error("Failed to save initial image dimensions:", err);
            }
          })
          .catch((err) => console.error("Failed to load uploaded image:", err));
      }

      // Reset the file input so the same file can be re-selected
      e.target.value = null;
    } catch (err) {
      console.error("Failed adding image element:", err);
    }
  };

  const handleAddTextElement = async (placeholderType = null) => {
    if (!selectedTemplate || !fabricCanvas) return;

    let content = "New Text";
    if (placeholderType === "name") content = "{name}";
    else if (placeholderType === "date") content = "{date}";
    else if (placeholderType === "course") content = "{course}";

    const newElement = {
      element_type: "text",
      content: content,
      placeholder_type: placeholderType === "static" ? null : placeholderType,
      x: 300 / (selectedTemplate.width || 1000),
      y: 300 / (selectedTemplate.height || 700),
      font_size: 40,
      font_family: "Arial",
      color: "#000000",
      alignment: "left",
    };

    try {
      const res = await fetch(
        `${API_BASE}/templates/${selectedTemplate.id}/elements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newElement),
        },
      );

      if (res.ok) {
        const tWidth = selectedTemplate.width || 1000;
        const tHeight = selectedTemplate.height || 700;

        const el = await res.json();
        const text = new fabric.IText(el.content, {
          left: el.x * tWidth,
          top: el.y * tHeight,
          fontSize: el.font_size,
          fontFamily: el.font_family,
          fill: el.color,
          textAlign: el.alignment,
          originX:
            el.alignment === "center"
              ? "center"
              : el.alignment === "right"
                ? "right"
                : "left",
        });
        text.set("id", el.id);
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        fabricCanvas.renderAll();
      }
    } catch (err) {
      console.error("Failed adding text element:", err);
    }
  };

  // ── Properties panel handlers ─────────────────────────────────────────────────
  const handleUpdateActiveObject = async (key, value) => {
    if (!activeObject || !fabricCanvas) return;

    // Apply locally
    activeObject.set(key, value);
    if (key === "textAlign") {
      activeObject.set({
        originX:
          value === "center" ? "center" : value === "right" ? "right" : "left",
      });
    }
    // If text modified, handle bounding boxes
    if (key === "text") activeObject.setCoords();
    fabricCanvas.renderAll();

    // Re-render local state for input typing
    setRevision((r) => r + 1);

    const payload = {};
    if (key === "fill") payload.color = value;
    if (key === "fontSize") payload.font_size = value;
    if (key === "fontFamily") payload.font_family = value;
    if (key === "text") payload.content = value;
    if (key === "textAlign") payload.alignment = value;

    // Debounce the fetch request to prevent database locks (SQLite) when typing fast
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(
          `${API_BASE}/templates/${selectedTemplate.id}/elements/${activeObject.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } catch (err) {
        console.error("Failed saving property:", err);
      }
    }, 500);
  };

  const handleDeleteActiveObject = async () => {
    if (!activeObject || !fabricCanvas || !selectedTemplate) return;
    const elementId = activeObject.id;
    try {
      await fetch(
        `${API_BASE}/templates/${selectedTemplate.id}/elements/${elementId}`,
        { method: "DELETE" }
      );
      fabricCanvas.remove(activeObject);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setActiveObject(null);
    } catch (err) {
      console.error("Failed to delete element:", err);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar - Templates List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col pt-4">
        <div className="px-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            QuickCert Templates
          </h2>

          <form
            onSubmit={handleCreateTemplate}
            className="space-y-3 bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm"
          >
            <h3 className="font-semibold text-sm text-gray-700">
              Create New Template
            </h3>
            <input
              name="name"
              placeholder="Template Name"
              required
              className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-blue-500"
            />
            <input
              name="description"
              placeholder="Description"
              required
              className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-blue-500"
            />
            <input
              type="file"
              name="file"
              required
              accept="image/*"
              className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-gray-200 file:rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded p-2 text-sm font-semibold hover:bg-blue-700 transition"
            >
              Add Template
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`p-4 border rounded-lg cursor-pointer transition shadow-sm ${
                selectedTemplate?.id === t.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50 bg-white"
              }`}
              onClick={() => setSelectedTemplate(t)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{t.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.id);
                  }}
                  className="text-red-500 text-xs font-semibold hover:text-red-700 transition"
                  title="Delete Template"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-4">
              No templates found.
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedTemplate ? (
          <>
            {/* Editor Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-xl font-bold text-gray-800">
                Editing:{" "}
                <span className="font-normal">{selectedTemplate.name}</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddTextElement("static")}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 font-medium transition"
                >
                  + Add Static Text
                </button>
                <button
                  onClick={() => handleAddTextElement("name")}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition"
                >
                  + Add Name
                </button>
                <button
                  onClick={() => handleAddTextElement("date")}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium transition"
                >
                  + Add Date
                </button>
                <button
                  onClick={() => handleAddTextElement("course")}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium transition"
                >
                  + Add Course
                </button>
                <label className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 font-medium transition cursor-pointer">
                  + Add Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAddImageElement}
                  />
                </label>
              </div>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 flex overflow-hidden">
              {/* Canvas Area */}
              <div
                className="flex-1 bg-gray-300 flex justify-center items-center p-5 relative overflow-hidden"
                ref={wrapperRef}
              >
                <div className="bg-white shadow-xl border border-gray-200">
                  <div
                    ref={canvasContainerRef}
                    style={{ width: "100%", height: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Properties Sidebar */}
              <div className="w-72 bg-white border-l border-gray-200 p-5 shrink-0 overflow-y-auto shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-lg mb-6 border-b pb-2">
                  Element Properties
                </h3>
                {activeObject && activeObject.type === "i-text" ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Text
                      </label>
                      <input
                        type="text"
                        value={activeObject.text}
                        onChange={(e) =>
                          handleUpdateActiveObject("text", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={activeObject.fontSize}
                        onChange={(e) =>
                          handleUpdateActiveObject(
                            "fontSize",
                            parseInt(e.target.value, 10),
                          )
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeObject.fill}
                          onChange={(e) =>
                            handleUpdateActiveObject("fill", e.target.value)
                          }
                          className="h-10 w-12 border border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 font-mono">
                          {activeObject.fill}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Font Family
                      </label>
                      <select
                        value={activeObject.fontFamily}
                        onChange={(e) =>
                          handleUpdateActiveObject("fontFamily", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Alignment
                      </label>
                      <select
                        value={activeObject.textAlign}
                        onChange={(e) =>
                          handleUpdateActiveObject("textAlign", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={handleDeleteActiveObject}
                        className="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-semibold hover:bg-red-600 hover:text-white transition"
                      >
                        🗑 Delete Element
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        Drag and drop to reposition. Changes are saved automatically.
                      </p>
                    </div>
                  </div>
                ) : activeObject && activeObject.type === "image" ? (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded">
                      <svg
                        className="w-10 h-10 mb-2 opacity-40 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <p className="text-sm font-semibold text-gray-600">
                        Image Element
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={handleDeleteActiveObject}
                        className="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-semibold hover:bg-red-600 hover:text-white transition"
                      >
                        🗑 Delete Element
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        Drag to reposition or resize. Changes are saved automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                    <svg
                      className="w-12 h-12 mb-2 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      ></path>
                    </svg>
                    <p>Select a text element to edit its properties.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <svg
              className="w-20 h-20 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <h2 className="text-2xl font-semibold text-gray-400">
              No template selected
            </h2>
            <p>
              Select a template from the sidebar or create a new one to begin
              editing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
