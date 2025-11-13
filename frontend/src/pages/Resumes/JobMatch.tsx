import React, { useState, useEffect } from "react";
import axios from "axios";

const JobMatch: React.FC = () => {
  const [userId, setUserId] = useState<string>("");
  const [jobId, setJobId] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [skillGaps, setSkillGaps] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user ID from localStorage and fetch jobs on mount
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        setError("No user logged in. Please log in first.");
      }
    } catch (e) {
      console.error("Error retrieving user ID:", e);
      setError("Failed to retrieve user information.");
    }

    // Fetch jobs from backend
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await axios.get("http://localhost:3000/jobs/list-all");
      setJobs(response.data || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs from server.");
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleMatch = async () => {
    if (!userId || !jobId) {
      setError("Please select a job");
      return;
    }

    setLoading(true);
    setError(null);
    setMatchResult(null);
    setSkillGaps(null);

    try {
      // Get overall match
      const matchRes = await axios.get(
        `http://localhost:3000/match?userId=${encodeURIComponent(userId)}&jobId=${encodeURIComponent(jobId)}`
      );

      if (matchRes.data.error) {
        setError(matchRes.data.error);
        setLoading(false);
        return;
      }

      setMatchResult(matchRes.data);

      // Get skill gaps
      try {
        const gapsRes = await axios.get(
          `http://localhost:3000/match/gaps?userId=${encodeURIComponent(userId)}&jobId=${encodeURIComponent(jobId)}`
        );
        if (!gapsRes.data.error) {
          setSkillGaps(gapsRes.data);
        }
      } catch (gapErr) {
        console.error("Error fetching skill gaps:", gapErr);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError("Failed to fetch match data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "#2ecc71"; // Green
    if (score >= 60) return "#f1c40f"; // Yellow
    if (score >= 40) return "#e67e22"; // Orange
    return "#e74c3c"; // Red
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto" }}>
      <h2 style={{ marginBottom: "1rem", textAlign: "center", color: "black" }}>Job Match Analyzer</h2>

      {/* Input Section */}
      <div style={{ marginBottom: "2rem", backgroundColor: "#f9f9f9", padding: "1.5rem", borderRadius: "12px" }}>
        <h4 style={{ color: "black", marginBottom: "1rem" }}>Find Your Job Match</h4>

        {/* Job ID Dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          {loadingJobs ? (
            <div style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "#f0f0f0",
              color: "#666",
            }}>
              Loading jobs...
            </div>
          ) : (
            <select
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                setMatchResult(null);
                setSkillGaps(null);
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontSize: "14px",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            >
              <option value="">-- Select a Job --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} @ {job.company} ({job.location}) {job.skills && job.skills.length > 0 ? `- ${job.skills.length} skills` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleMatch}
          disabled={loading || !userId || !jobId || loadingJobs}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading || !userId || !jobId || loadingJobs ? "not-allowed" : "pointer",
            opacity: loading || !userId || !jobId || loadingJobs ? 0.6 : 1,
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          {loading ? "Analyzing..." : "Analyze Match"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#c0392b", padding: "12px", background: "#fadbd8", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* Match Result */}
      {matchResult && !error && (
        <div style={{ backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Overall Score */}
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: getMatchColor(matchResult.overall_match || 0),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "white",
                flexDirection: "column",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                {Math.round(matchResult.overall_match || 0)}%
              </div>
              <div style={{ fontSize: "14px", marginTop: "8px" }}>
                {getMatchLabel(matchResult.overall_match || 0)}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ color: "black", marginBottom: "1rem" }}>Score Breakdown</h4>
            <div style={{ display: "grid", gap: "12px" }}>
              {matchResult.skill_score !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Skill Match</span>
                    <span>{Math.round(matchResult.skill_score)}%</span>
                  </div>
                  <div style={{ background: "#eee", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: getMatchColor(matchResult.skill_score),
                        width: `${matchResult.skill_score}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {matchResult.experience_score !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Experience Match</span>
                    <span>{Math.round(matchResult.experience_score)}%</span>
                  </div>
                  <div style={{ background: "#eee", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: getMatchColor(matchResult.experience_score),
                        width: `${matchResult.experience_score}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {matchResult.education_score !== undefined && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>Education Match</span>
                    <span>{Math.round(matchResult.education_score)}%</span>
                  </div>
                  <div style={{ background: "#eee", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: getMatchColor(matchResult.education_score),
                        width: `${matchResult.education_score}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Individual Skill Scores */}
          {matchResult.skill_details && Object.keys(matchResult.skill_details).length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "black", marginBottom: "1rem" }}>Skill-by-Skill Breakdown</h4>
              <div style={{ display: "grid", gap: "12px" }}>
                {Object.entries(matchResult.skill_details).map(([skill, data]: [string, any]) => (
                  <div key={skill} style={{ padding: "10px", background: "#fff", border: "1px solid #ddd", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{skill}</span>
                      <span style={{ color: "#666" }}>
                        Your Level: {data.have} / Required: {data.need}
                      </span>
                    </div>
                    <div style={{ background: "#eee", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: getMatchColor(data.score),
                          width: `${data.score}%`,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                      Match: {data.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {matchResult.strengths && matchResult.strengths.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "black", marginBottom: "1rem" }}>Your Strengths</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {matchResult.strengths.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      background: "#d4edda",
                      color: "#155724",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill Gaps */}
          {skillGaps && skillGaps.gaps && skillGaps.gaps.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "black", marginBottom: "1rem" }}>Skill Gaps to Address</h4>
              <div style={{ display: "grid", gap: "12px" }}>
                {skillGaps.gaps.slice(0, 10).map((gap: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "#fff3cd",
                      border: "1px solid #ffc107",
                      padding: "12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{gap.skill}</span>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        You have: {gap.have} / Need: {gap.need}
                      </span>
                    </div>
                    <div style={{ background: "#fff", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: "#ff9800",
                          width: `${(gap.have / Math.max(gap.need, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Details */}
          {matchResult.match_summary && (
            <div style={{ marginTop: "1.5rem", padding: "12px", background: "#e8f4f8", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Summary:</strong> {matchResult.match_summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobMatch;
