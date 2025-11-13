import React, { useState } from "react";
import axios from "axios";

const InterviewInsights = () => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for all sections
  const [interviewProcess, setInterviewProcess] = useState<any>(null);
  const [commonQuestions, setCommonQuestions] = useState<any>(null);
  const [interviewers, setInterviewers] = useState<any>(null);
  const [formats, setFormats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [successTips, setSuccessTips] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    process: true,
    questions: false,
    interviewers: false,
    formats: false,
    recommendations: false,
    timeline: false,
    tips: false,
    checklist: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleGenerateInsights = async () => {
    if (!company.trim()) {
      setError("Please enter a company name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = { company, role };

      const [
        processRes,
        questionsRes,
        interviewersRes,
        formatsRes,
        recommendationsRes,
        timelineRes,
        tipsRes,
        checklistRes,
      ] = await Promise.all([
        axios.get("http://localhost:3000/interview/process", { params: { company } }),
        axios.get("http://localhost:3000/interview/questions", { params }),
        axios.get("http://localhost:3000/interview/interviewers", { params: { company } }),
        axios.get("http://localhost:3000/interview/formats", { params: { company } }),
        axios.get("http://localhost:3000/interview/recommendations", { params }),
        axios.get("http://localhost:3000/interview/timeline", { params: { company } }),
        axios.get("http://localhost:3000/interview/tips", { params: { company } }),
        axios.get("http://localhost:3000/interview/checklist", { params }),
      ]);

      setInterviewProcess(processRes.data);
      setCommonQuestions(questionsRes.data);
      setInterviewers(interviewersRes.data);
      setFormats(formatsRes.data);
      setRecommendations(recommendationsRes.data);
      setTimeline(timelineRes.data);
      setSuccessTips(tipsRes.data);
      setChecklist(checklistRes.data);
    } catch (err) {
      console.error("Error fetching interview insights:", err);
      setError("Failed to fetch interview insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      company,
      role,
      interviewProcess,
      commonQuestions,
      interviewers,
      formats,
      recommendations,
      timeline,
      successTips,
      checklist,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${company.replace(/\s+/g, "_")}_Interview_Prep_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasData = interviewProcess || commonQuestions || timeline;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "black", marginBottom: "1rem", textAlign: "center" }}>
        Interview Insights & Preparation
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
        Get comprehensive interview preparation insights for your target company
      </p>

      {error && (
        <div style={{ padding: "12px", background: "#fadbd8", color: "#c0392b", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Input Section */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "black", marginBottom: "1rem" }}>Company & Role Information</h3>
        <div style={{ display: "grid", gap: "12px", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Company Name *</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Amazon, Microsoft"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleGenerateInsights}
            disabled={loading || !company.trim()}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: loading || !company.trim() ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading || !company.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Generate Insights"}
          </button>

          <button
            onClick={handleExport}
            disabled={!hasData}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: !hasData ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: !hasData ? "not-allowed" : "pointer",
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Interview Process Section */}
      {interviewProcess && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("process")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Interview Process & Stages</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.process ? "−" : "+"}</span>
          </div>
          {expandedSections.process && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", marginBottom: "1rem" }}>
                <strong>Total Stages:</strong> {interviewProcess.totalStages} | <strong>Timeline:</strong> {interviewProcess.estimatedTimeline}
              </p>
              <div style={{ display: "grid", gap: "12px" }}>
                {interviewProcess.stages.map((stage: any, idx: number) => (
                  <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{stage.stage}</div>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{stage.description}</div>
                    <div style={{ fontSize: "13px", color: "#999" }}>
                      <strong>Duration:</strong> {stage.duration} | <strong>Focus:</strong> {stage.focus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Common Questions Section */}
      {commonQuestions && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("questions")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Common Interview Questions</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.questions ? "−" : "+"}</span>
          </div>
          {expandedSections.questions && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#007bff", marginBottom: "0.5rem" }}>Technical Questions</h4>
                <ul style={{ marginLeft: "1.5rem", color: "#333" }}>
                  {commonQuestions.questions.technical.map((q: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{q}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#28a745", marginBottom: "0.5rem" }}>Behavioral Questions</h4>
                <ul style={{ marginLeft: "1.5rem", color: "#333" }}>
                  {commonQuestions.questions.behavioral.map((q: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>Company-Specific Questions</h4>
                <ul style={{ marginLeft: "1.5rem", color: "##333" }}>
                  {commonQuestions.questions.companySpecific.map((q: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interviewers Section */}
      {interviewers && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("interviewers")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Interviewer Information</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.interviewers ? "−" : "+"}</span>
          </div>
          {expandedSections.interviewers && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", fontStyle: "italic", marginBottom: "1rem" }}>{interviewers.note}</p>
              <div style={{ display: "grid", gap: "12px" }}>
                {interviewers.interviewers.map((interviewer: any, idx: number) => (
                  <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "16px" }}>{interviewer.name}</div>
                    <div style={{ fontSize: "14px", color: "#007bff", marginBottom: "4px" }}>{interviewer.title}</div>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{interviewer.background}</div>
                    <div style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}>
                      <strong>Focus:</strong> {interviewer.focus}
                    </div>
                    <div style={{ fontSize: "13px", color: "#28a745" }}>
                      <strong>Tips:</strong> {interviewer.tips}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interview Formats Section */}
      {formats && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("formats")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Interview Formats</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.formats ? "−" : "+"}</span>
          </div>
          {expandedSections.formats && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", fontStyle: "italic", marginBottom: "1rem" }}>{formats.note}</p>
              <div style={{ display: "grid", gap: "12px" }}>
                {/* Coding Challenges */}
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                  <h4 style={{ color: "#007bff", marginBottom: "8px" }}>Coding Challenges</h4>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div><strong>Platform:</strong> {formats.formats.codingChallenges.platform}</div>
                    <div><strong>Duration:</strong> {formats.formats.codingChallenges.duration}</div>
                    <div><strong>Difficulty:</strong> {formats.formats.codingChallenges.difficulty}</div>
                    <div><strong>Topics:</strong> {formats.formats.codingChallenges.topics.join(", ")}</div>
                    <div><strong>Languages:</strong> {formats.formats.codingChallenges.allowedLanguages.join(", ")}</div>
                  </div>
                </div>

                {/* System Design */}
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                  <h4 style={{ color: "#28a745", marginBottom: "8px" }}>System Design</h4>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div><strong>Format:</strong> {formats.formats.systemDesign.format}</div>
                    <div><strong>Duration:</strong> {formats.formats.systemDesign.duration}</div>
                    <div><strong>Topics:</strong> {formats.formats.systemDesign.topics.join(", ")}</div>
                    <div><strong>Expectations:</strong> {formats.formats.systemDesign.expectations}</div>
                  </div>
                </div>

                {/* Behavioral */}
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                  <h4 style={{ color: "#ff6b6b", marginBottom: "8px" }}>Behavioral Interviews</h4>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div><strong>Format:</strong> {formats.formats.behavioral.format}</div>
                    <div><strong>Duration:</strong> {formats.formats.behavioral.duration}</div>
                    <div><strong>Topics:</strong> {formats.formats.behavioral.topics.join(", ")}</div>
                    <div><strong>Framework:</strong> {formats.formats.behavioral.framework}</div>
                  </div>
                </div>

                {/* Culture Fit */}
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                  <h4 style={{ color: "#9b59b6", marginBottom: "8px" }}>Culture Fit</h4>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <div><strong>Format:</strong> {formats.formats.culturefit.format}</div>
                    <div><strong>Duration:</strong> {formats.formats.culturefit.duration}</div>
                    <div><strong>Topics:</strong> {formats.formats.culturefit.topics.join(", ")}</div>
                    <div><strong>Focus:</strong> {formats.formats.culturefit.focus}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preparation Recommendations Section */}
      {recommendations && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("recommendations")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Preparation Recommendations</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.recommendations ? "−" : "+"}</span>
          </div>
          {expandedSections.recommendations && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", marginBottom: "1rem" }}>
                <strong>Estimated Prep Time:</strong> {recommendations.estimatedPrepTime}
              </p>

              {/* Study Materials */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#007bff", marginBottom: "0.5rem" }}>Study Materials</h4>
                {recommendations.recommendations.studyMaterials.map((material: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: "1rem", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>{material.category}</div>
                    <ul style={{ marginLeft: "1.5rem", color: "#666" }}>
                      {material.resources.map((resource: string, rIdx: number) => (
                        <li key={rIdx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Technical Topics */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#28a745", marginBottom: "0.5rem" }}>Technical Topics to Master</h4>
                <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
                  <ul style={{ marginLeft: "1.5rem", color: "#666" }}>
                    {recommendations.recommendations.technicalTopics.map((topic: string, idx: number) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>Preparation Timeline</h4>
                <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
                  {Object.entries(recommendations.recommendations.timelineRecommendation).map(([period, task]: [string, any]) => (
                    <div key={period} style={{ marginBottom: "8px", display: "flex", gap: "10px" }}>
                      <div style={{ fontWeight: "600", minWidth: "150px", color: "#007bff" }}>{period}:</div>
                      <div style={{ color: "#666" }}>{task}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Expectations Section */}
      {timeline && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("timeline")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Interview Process Timeline</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.timeline ? "−" : "+"}</span>
          </div>
          {expandedSections.timeline && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", marginBottom: "1rem" }}>
                <strong>Total Duration:</strong> {timeline.totalDuration}
              </p>
              <p style={{ color: "#666", fontStyle: "italic", marginBottom: "1rem" }}>{timeline.note}</p>
              <div style={{ display: "grid", gap: "12px" }}>
                {timeline.timeline.map((phase: any, idx: number) => (
                  <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>{phase.phase}</div>
                      <div style={{ fontSize: "14px", color: "#007bff", fontWeight: "600" }}>{phase.timeframe}</div>
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{phase.description}</div>
                    <div style={{ fontSize: "13px", color: "#28a745" }}>
                      <strong>Action:</strong> {phase.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Tips Section */}
      {successTips && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("tips")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Success Tips from Candidates</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.tips ? "−" : "+"}</span>
          </div>
          {expandedSections.tips && (
            <div style={{ marginTop: "1rem" }}>
              {/* Candidate Insights */}
              <div style={{ marginBottom: "1.5rem", padding: "12px", background: "#fff3cd", borderRadius: "6px" }}>
                <h4 style={{ color: "#856404", marginBottom: "0.5rem" }}>Key Insights</h4>
                <ul style={{ marginLeft: "1.5rem", color: "#856404" }}>
                  {successTips.candidateInsights.map((insight: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{insight}</li>
                  ))}
                </ul>
              </div>

              {/* Tips by Category */}
              <div style={{ display: "grid", gap: "12px" }}>
                {successTips.tips.map((tipCategory: any, idx: number) => (
                  <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ color: "#007bff", margin: 0 }}>{tipCategory.category}</h4>
                      <div style={{ color: "#ffc107", fontWeight: "bold" }}>
                        {"⭐".repeat(tipCategory.rating)}
                      </div>
                    </div>
                    <ul style={{ marginLeft: "1.5rem", color: "#666" }}>
                      {tipCategory.tips.map((tip: string, tIdx: number) => (
                        <li key={tIdx} style={{ marginBottom: "4px" }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preparation Checklist Section */}
      {checklist && (
        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div
            onClick={() => toggleSection("checklist")}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ color: "black", margin: 0 }}>Interview Preparation Checklist</h3>
            <span style={{ fontSize: "20px" }}>{expandedSections.checklist ? "−" : "+"}</span>
          </div>
          {expandedSections.checklist && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "#666", marginBottom: "1rem" }}>
                <strong>Total Items:</strong> {checklist.totalItems}
              </p>

              {/* Before Interview */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#007bff", marginBottom: "0.5rem" }}>Before Interview</h4>
                <div style={{ display: "grid", gap: "8px" }}>
                  {checklist.checklist.beforeInterview.map((item: any, idx: number) => (
                    <div key={idx} style={{ padding: "10px", background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <input type="checkbox" style={{ width: "16px", height: "16px" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "#333" }}>{item.item}</span>
                        <span style={{ marginLeft: "10px", fontSize: "12px", color: item.priority === "High" ? "#e74c3c" : item.priority === "Medium" ? "#f39c12" : "#95a5a6", fontWeight: "600" }}>
                          ({item.priority})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day of Interview */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#28a745", marginBottom: "0.5rem" }}>Day of Interview</h4>
                <div style={{ display: "grid", gap: "8px" }}>
                  {checklist.checklist.dayOfInterview.map((item: any, idx: number) => (
                    <div key={idx} style={{ padding: "10px", background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <input type="checkbox" style={{ width: "16px", height: "16px" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "#333" }}>{item.item}</span>
                        <span style={{ marginLeft: "10px", fontSize: "12px", color: item.priority === "High" ? "#e74c3c" : item.priority === "Medium" ? "#f39c12" : "#95a5a6", fontWeight: "600" }}>
                          ({item.priority})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Interview */}
              <div>
                <h4 style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>After Interview</h4>
                <div style={{ display: "grid", gap: "8px" }}>
                  {checklist.checklist.afterInterview.map((item: any, idx: number) => (
                    <div key={idx} style={{ padding: "10px", background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <input type="checkbox" style={{ width: "16px", height: "16px" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "#333" }}>{item.item}</span>
                        <span style={{ marginLeft: "10px", fontSize: "12px", color: item.priority === "High" ? "#e74c3c" : item.priority === "Medium" ? "#f39c12" : "#95a5a6", fontWeight: "600" }}>
                          ({item.priority})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewInsights;
