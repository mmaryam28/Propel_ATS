import React, { useEffect, useState } from "react";

// Simple UI primitives (replace with shadcn/ui if you already use it)
const Button = ({ children, onClick, variant = "primary" }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded text-sm font-medium transition ${
      variant === "primary"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : variant === "outline"
        ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    {children}
  </button>
);

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [customSettings, setCustomSettings] = useState({
    color: "#2563eb",
    font: "Inter",
    layout: "Classic",
  });

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + "/api/resume/templates")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched templates:", data);

        // FIX #1 — handle all backend response shapes
        if (Array.isArray(data)) {
          setTemplates(data);
        } else if (Array.isArray(data.templates)) {
          setTemplates(data.templates);
        } else {
          console.warn("Unexpected template format — using fallback sample templates");
          setTemplates([
            { id: 1, name: "Chronological", type: "chronological" },
            { id: 2, name: "Functional", type: "functional" },
            { id: 3, name: "Hybrid", type: "hybrid" },
          ]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch templates:", err);

        // FIX #2 — ensure templates always has data even on fetch error
        setTemplates([
          { id: 1, name: "Chronological", type: "chronological" },
          { id: 2, name: "Functional", type: "functional" },
          { id: 3, name: "Hybrid", type: "hybrid" },
        ]);
      });
  }, []);


  // Create a new resume using selected template
  function handleUseTemplate(template) {
    console.log("Creating resume with template:", template);
    fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + "/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "1", // replace with logged-in user
        title: `New ${template.name} Resume`,
        templateId: template.id,
      }),
    })
      .then(res => res.json())
      .then(() => alert(`Created new ${template.name} resume!`))
      .catch(err => console.error("Failed to create resume", err));
  }

  // Save custom style (colors/fonts/layout)
  function handleSaveCustomization() {
    fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/api/resume/templates/${selectedTemplate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colors: { primary: customSettings.color }, font: customSettings.font, layout: customSettings.layout }),
    })
      .then(() => {
        alert("Customization saved!");
        setShowCustomize(false);
      })
      .catch(err => console.error(err));
  }

  // Set template as default
  function handleSetDefault(template) {
    fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/api/resume/templates/${template.id}/default`, {
      method: "POST",
    })
      .then(() => alert(`${template.name} set as default template!`))
      .catch(err => console.error("Error setting default template", err));
  }

  // Share template (stub)
  function handleShareTemplate(email) {
    fetch((import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/api/resume/templates/${selectedTemplate.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(() => alert("Template shared successfully!"))
      .catch(err => console.error(err));
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4" style={{ color: "#1e88e5" }}>Resume Templates</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(templates) &&
          templates.map((t) => (
            <div
              key={t.id}
              className="border rounded-xl p-4 flex flex-col items-center hover:shadow-lg transition"
            >
              {/* Template preview placeholder */}
              <div
                className="h-40 w-full bg-gray-100 rounded mb-3 cursor-pointer flex items-center justify-center" 
                onClick={() => {
                  setSelectedTemplate(t);
                  setShowPreview(true);
                }}
              >
                <span className="text-gray-500 text-sm">Click to Preview</span>
              </div>

              <h3 className="font-semibold mb-2" style={{ color: "#1e88e5" }} >{t.name}</h3>
              <p className="text-sm text-gray-500 mb-2 capitalize">
                Type: {t.type || "custom"}
              </p>

              <div className="flex gap-2">
                <Button onClick={() => handleUseTemplate(t)}>Use</Button>
                <Button variant="outline" onClick={() => { setSelectedTemplate(t); setShowCustomize(true); }}>
                  Customize
                </Button>
              </div>

              <button
                onClick={() => handleSetDefault(t)}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Set as Default
              </button>
            </div>
          ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[600px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{selectedTemplate.name} Preview</h2>
            <div className="border h-80 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-gray-500 text-sm">
                [Template layout preview here]
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                Use This Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomize && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowCustomize(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[500px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              Customize {selectedTemplate.name}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={customSettings.color}
                  onChange={(e) =>
                    setCustomSettings({ ...customSettings, color: e.target.value })
                  }
                  className="w-16 h-8 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Font</label>
                <select
                  value={customSettings.font}
                  onChange={(e) =>
                    setCustomSettings({ ...customSettings, font: e.target.value })
                  }
                  className="border rounded p-2 w-full"
                >
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                  <option>Georgia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Layout</label>
                <select
                  value={customSettings.layout}
                  onChange={(e) =>
                    setCustomSettings({ ...customSettings, layout: e.target.value })
                  }
                  className="border rounded p-2 w-full"
                >
                  <option>Classic</option>
                  <option>Modern</option>
                  <option>Compact</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCustomize(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCustomization}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal (optional multi-user) */}
      {showShare && selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[400px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Share Template</h2>
            <input
              type="email"
              placeholder="Enter teammate’s email"
              id="share-email"
              className="border rounded p-2 w-full mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShare(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleShareTemplate(document.getElementById("share-email").value)
                }
              >
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
''