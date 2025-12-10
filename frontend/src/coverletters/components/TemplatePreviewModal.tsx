import { useEffect, useState } from "react";
import { getTemplate, saveEditedCoverLetter, exportCoverLetter, TemplateResponse } from "../api/client";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";

export default function TemplatePreviewModal({
  slug,
  onClose,
}: {
  slug: string | null;
  onClose: () => void;
}) {
  const [company, setCompany] = useState("");
  const [body, setBody] = useState<string>("");
  const [aiOutput, setAiOutput] = useState<string>("");
  const [editedOutput, setEditedOutput] = useState<string>("");
  const [tone, setTone] = useState("formal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (slug) {
      getTemplate(slug).then((t: TemplateResponse) => setBody(t.latest?.body ?? ""));
      setAiOutput("");
      setEditedOutput("");
    }
  }, [slug]);

  if (!slug) return null;

  async function handleGenerate() {
    setLoading(true);
    setAiOutput("Generating...");
    try {
      if (!slug) return;
      const templateData = await getTemplate(slug!);
      const industry = templateData?.category?.name || "General";
      const roleByIndustry: Record<string, string> = {
        "Software Engineering": "Software Engineer",
        "Finance & Consulting": "Financial Analyst",
        "Marketing & Design": "Marketing Associate",
        "Healthcare & Life Sciences": "Clinical Research Assistant",
        "Education & Training": "Teacher or Instructor",
        "Law & Policy": "Legal Analyst",
      };
      const role = roleByIndustry[industry] || "Professional";
      const jobDescription = `${role} position at ${company} in the ${industry} field.`;

      const profileSummary =
        industry === "Healthcare & Life Sciences"
          ? "Dedicated healthcare professional experienced in patient care, research, and evidence-based practice."
          : industry === "Education & Training"
          ? "Passionate educator with experience in curriculum development and student engagement."
          : industry === "Law & Policy"
          ? "Analytical and detail-oriented individual with experience in policy research and legal documentation."
          : industry === "Finance & Consulting"
          ? "Data-driven problem solver skilled in business analysis and financial modeling."
          : industry === "Marketing & Design"
          ? "Creative professional experienced in branding, social media campaigns, and storytelling."
          : "Computer Science student experienced in React, Node.js, and modern web development.";

      const res = await fetch("http://localhost:3000/coverletters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: slug,
          jobDescription,
          profileSummary,
          tone,
          company,
          industry,
        }),
      });

      const data = await res.json();
      setAiOutput(data.generated || "No content generated.");
      setEditedOutput(data.generated || "");
      
      // Auto-generate title from company name
      const autoTitle = company ? `${company} - Cover Letter` : `Cover Letter - ${new Date().toLocaleDateString()}`;
      setTitle(autoTitle);
    } catch (err) {
      console.error("Error generating AI cover letter:", err);
      setAiOutput("Error generating cover letter.");
    }
    setLoading(false);
  }

  async function handleSaveEdits() {
    if (!title.trim()) {
      alert('Please provide a title for the cover letter');
      return;
    }

    // Strip HTML tags from editedOutput for plain text storage
    const plainText = editedOutput.replace(/<[^>]*>/g, '').trim();
    
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      await axios.post('http://localhost:3000/coverletters/save', {
        userId,
        title: title.trim(),
        content: plainText,
        company: company || null
      }, { withCredentials: true });
      
      alert('Cover letter saved successfully! You can now select it in Quality Check.');
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err?.response?.data?.error || "Failed to save cover letter.");
    }
    setSaving(false);
  }

  async function handleExport(format: string) {
    try {
      await exportCoverLetter(editedOutput || aiOutput, format);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export file.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 shadow-lg text-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">Cover Letter Preview</div>
          <button onClick={onClose} className="text-lg font-bold">✕</button>
        </div>

        <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 text-gray-800 max-h-[40vh] overflow-auto mb-3">
          {body}
        </pre>

        <div className="mb-2">
          <label className="text-sm font-medium block mb-1 text-gray-900">Company Name:</label>
          <input
            type="text"
            placeholder="e.g. Google"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-gray-900">Tone:</label>
          <select
            className="border rounded px-2 py-1 text-sm text-gray-900"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="analytical">Analytical</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`border rounded px-3 py-1 text-sm font-medium text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Generating..." : "Generate AI Cover Letter"}
          </button>
        </div>

        {aiOutput && (
          <div>
            <div className="font-semibold text-sm mb-1 text-gray-900">AI Output (Editable):</div>
            
            <div className="mb-2">
              <label className="text-sm font-medium block mb-1 text-gray-900">Cover Letter Title:</label>
              <input
                type="text"
                placeholder="e.g., Google - Financial Analyst"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-full text-gray-900"
              />
            </div>

            <ReactQuill
              theme="snow"
              value={editedOutput}
              onChange={setEditedOutput}
              className="bg-white border rounded text-sm"
              placeholder="Edit your AI-generated letter here..."
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveEdits}
                disabled={saving || !title.trim()}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1 rounded disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save as Version"}
              </button>

              <button
                onClick={() => handleExport("pdf")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
              >
                Export PDF
              </button>
              <button
                onClick={() => handleExport("docx")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1 rounded"
              >
                Export DOCX
              </button>
              <button
                onClick={() => handleExport("txt")}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded"
              >
                Export TXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
