import { useEffect, useState } from "react";
import { getTemplate } from "../api/client";

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
  const [tone, setTone] = useState("formal");
  const [loading, setLoading] = useState(false);

  // Fetch the template body when a template is opened
  useEffect(() => {
    if (slug) {
      getTemplate(slug).then((t) => setBody(t.latest?.body ?? ""));
      setAiOutput(""); // reset previous output when modal changes
    }
  }, [slug]);

  if (!slug) return null;

  // === UC-056 + UC-057: Generate AI Cover Letter with Company Research ===
  async function handleGenerate() {
    setLoading(true);
    setAiOutput("Generating...");
    try {
      const res = await fetch("http://localhost:3000/coverletters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: slug,
          jobDescription:
            "Software Engineer Intern at Google focusing on React.",
          profileSummary:
            "Computer Science student with React and Node.js experience, strong teamwork skills, and passion for frontend development.",
          tone,
          company, // ✅ Send the company name to backend
        }),
      });

      const data = await res.json();
      setAiOutput(data.generated || "No content generated.");
    } catch (err) {
      console.error("Error generating AI cover letter:", err);
      setAiOutput("Error generating cover letter.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">Cover Letter Preview</div>
          <button onClick={onClose} className="text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Template Body */}
        <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 max-h-[40vh] overflow-auto mb-3">
          {body}
        </pre>

        {/* Company Input */}
        <div className="mb-2">
          <label className="text-sm font-medium block mb-1">
            Company Name:
          </label>
          <input
            type="text"
            placeholder="e.g. Google"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          />
        </div>

        {/* Tone Selection + Generate Button */}
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium">Tone:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
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

        {/* AI Output */}
        {aiOutput && (
          <div>
            <div className="font-semibold text-sm mb-1">AI Output:</div>
            <pre className="whitespace-pre-wrap text-sm border rounded p-3 bg-gray-50 max-h-[40vh] overflow-auto">
              {aiOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
