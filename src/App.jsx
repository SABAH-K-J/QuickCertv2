import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

const API_BASE = "/api";

function App() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [, setRevision] = useState(0); // Used to force React updates 
  
  const canvasContainerRef = useRef(null);
  const wrapperRef = useRef(null);
  const saveTimeoutRef = useRef(null);

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

  // Setup Fabric canvas when a template is selected
  useEffect(() => {
    if (!selectedTemplate || !canvasContainerRef.current) return;

    // Isolate React from Fabric DOM manipulation by manually inserting the canvas
    canvasContainerRef.current.innerHTML = '';
    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'fabric-canvas';
    canvasContainerRef.current.appendChild(canvasElement);

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasElement, {
      width: 1000,
      height: 700,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    setFabricCanvas(canvas);

    // Initialize background image if it exists
    if (selectedTemplate.background_image) {
      // Normalize slashes for Windows and ensure spaces/special chars are URL encoded
      const cleanPath = selectedTemplate.background_image.replace(/\\/g, '/');
      const bgUrl = `/${cleanPath}`;
      
      fabric.Image.fromURL(bgUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          img.set({ 
            originX: "left", 
            originY: "top", 
            left: 0, 
            top: 0, 
            selectable: false, 
            evented: false 
          });
          img.scaleToWidth(canvas.width);
          img.scaleToHeight(canvas.height);
          canvas.add(img);
          img.sendToBack();
          canvas.renderAll();
        })
        .catch(err => console.error("Failed loading background image:", err));
    }

    // Load template elements
    fetch(`${API_BASE}/templates/${selectedTemplate.id}/elements`)
      .then(res => res.json())
      .then(eleData => {
        eleData.forEach(el => {
          if (el.element_type === 'text') {
            const text = new fabric.IText(el.content, {
              left: el.x,
              top: el.y,
              fontSize: el.font_size,
              fontFamily: el.font_family || 'Arial',
              fill: el.color || '#000000',
              textAlign: el.alignment || 'left',
              // Force dimensions to be fully baked, ignoring previous scale
              scaleX: 1,
              scaleY: 1
            });
            text.set('id', el.id);
            canvas.add(text);
          }
        });
        canvas.renderAll();
      });

    // Handle Responsive resizing
    const resizeCanvas = () => {
      if (!wrapperRef.current || !canvas) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      // Allow padding
      const scale = Math.min((clientWidth - 40) / 1000, (clientHeight - 40) / 700);
      const finalScale = Math.max(0.1, scale);
      
      canvas.setDimensions({ width: 1000 * finalScale, height: 700 * finalScale });
      canvas.setZoom(finalScale);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    resizeCanvas(); // initial sizing

    // Object modification hook to auto-save positioning
    const handleObjectModified = async (e) => {
      const target = e.target;
      if (!target || !target.id) return;
      
      // If object was scaled, bake it into font size directly
      let currentFontSize = target.fontSize;
      if (target.type === 'i-text' && (target.scaleX !== 1 || target.scaleY !== 1)) {
        currentFontSize = Math.round(target.fontSize * target.scaleY);
        target.set({
          fontSize: currentFontSize,
          scaleX: 1,
          scaleY: 1
        });
        target.setCoords();
        canvas.renderAll();
        setRevision(r => r + 1); // trigger properties panel re-render
      }

      const payload = {
        x: Math.round(target.left),
        y: Math.round(target.top),
        content: target.text,
        font_size: currentFontSize,
        color: target.fill
      };

      try {
        await fetch(`${API_BASE}/templates/${selectedTemplate.id}/elements/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed saving object position:", err);
      }
    };

    canvas.on('object:modified', handleObjectModified);
    
    // Set active object for properties panel
    const updateActiveObj = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 1) {
        setActiveObject(activeObjects[0]);
      } else {
        setActiveObject(null);
      }
    };

    canvas.on('selection:created', updateActiveObj);
    canvas.on('selection:updated', updateActiveObj);
    canvas.on('selection:cleared', updateActiveObj);
    canvas.on('object:modified', updateActiveObj);
    
    // Also mark canvas updates when typing directly on canvas
    canvas.on('text:changed', () => setRevision(r => r + 1));

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      setActiveObject(null);
      setFabricCanvas(null);
    };
  }, [selectedTemplate]);

  const handleAddTextElement = async (placeholderType = null) => {
    if (!selectedTemplate || !fabricCanvas) return;
    
    let content = "New Text";
    if (placeholderType === 'name') content = "{name}";
    else if (placeholderType === 'date') content = "{date}";
    else if (placeholderType === 'course') content = "{course}";

    const newElement = {
      element_type: "text",
      content: content,
      placeholder_type: placeholderType === 'static' ? null : placeholderType,
      x: 300,
      y: 300,
      font_size: 40,
      font_family: "Arial",
      color: "#000000",
      alignment: "left"
    };

    try {
      const res = await fetch(`${API_BASE}/templates/${selectedTemplate.id}/elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newElement)
      });
      
      if (res.ok) {
        const el = await res.json();
        const text = new fabric.IText(el.content, {
          left: el.x,
          top: el.y,
          fontSize: el.font_size,
          fontFamily: el.font_family,
          fill: el.color,
          textAlign: el.alignment,
        });
        text.set('id', el.id);
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        fabricCanvas.renderAll();
      }
    } catch (err) {
      console.error("Failed adding text element:", err);
    }
  };

  const handleUpdateActiveObject = async (key, value) => {
    if (!activeObject || !fabricCanvas) return;
    
    // Apply locally
    activeObject.set(key, value);
    // If text modified, handle bounding boxes
    if (key === 'text') activeObject.setCoords();
    fabricCanvas.renderAll();

    // Re-render local state for input typing
    setRevision(r => r + 1);

    const payload = {};
    if (key === 'fill') payload.color = value;
    if (key === 'fontSize') payload.font_size = value;
    if (key === 'fontFamily') payload.font_family = value;
    if (key === 'text') payload.content = value;

    // Debounce the fetch request to prevent database locks (SQLite) when typing fast
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/templates/${selectedTemplate.id}/elements/${activeObject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed saving property:", err);
      }
    }, 500);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* Sidebar - Templates List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col pt-4">
        <div className="px-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">QuickCert Templates</h2>
          
          <form onSubmit={handleCreateTemplate} className="space-y-3 bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-sm text-gray-700">Create New Template</h3>
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
          {templates.map(t => (
            <div key={t.id} 
              className={`p-4 border rounded-lg cursor-pointer transition shadow-sm ${
                selectedTemplate?.id === t.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50 bg-white'
              }`}
              onClick={() => setSelectedTemplate(t)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{t.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
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
                Editing: <span className="font-normal">{selectedTemplate.name}</span>
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAddTextElement('static')}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 font-medium transition"
                >
                  + Add Static Text
                </button>
                <button 
                  onClick={() => handleAddTextElement('name')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition"
                >
                  + Add Name
                </button>
                <button 
                  onClick={() => handleAddTextElement('date')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium transition"
                >
                  + Add Date
                </button>
                <button 
                  onClick={() => handleAddTextElement('course')}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium transition"
                >
                  + Add Course
                </button>
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
                  <div ref={canvasContainerRef} style={{width: '100%', height: '100%'}}></div>
                </div>
              </div>
              
              {/* Properties Sidebar */}
              <div className="w-72 bg-white border-l border-gray-200 p-5 shrink-0 overflow-y-auto shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-lg mb-6 border-b pb-2">Element Properties</h3>
                {activeObject && activeObject.type === 'i-text' ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Text</label>
                      <input 
                        type="text" 
                        value={activeObject.text} 
                        onChange={(e) => handleUpdateActiveObject('text', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Font Size</label>
                      <input 
                        type="number" 
                        value={activeObject.fontSize} 
                        onChange={(e) => handleUpdateActiveObject('fontSize', parseInt(e.target.value, 10))}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={activeObject.fill} 
                          onChange={(e) => handleUpdateActiveObject('fill', e.target.value)}
                          className="h-10 w-12 border border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 font-mono">{activeObject.fill}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Font Family</label>
                      <select 
                        value={activeObject.fontFamily} 
                        onChange={(e) => handleUpdateActiveObject('fontFamily', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                    <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
                      Drag and drop to reposition. Changes are saved automatically.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                    <p>Select a text element to edit its properties.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <h2 className="text-2xl font-semibold text-gray-400">No template selected</h2>
            <p>Select a template from the sidebar or create a new one to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;