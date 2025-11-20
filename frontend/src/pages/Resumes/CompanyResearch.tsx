import React, { useState, useEffect } from "react";
import axios from "axios";

const CompanyResearch: React.FC = () => {
  const [company, setCompany] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState<boolean>(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!company.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.get(`http://localhost:3000/research?company=${encodeURIComponent(company)}`);
      if (res?.data?.error) {
        setError(res.data.error);
        setResult(null);
      } else {
        setResult(res?.data || null);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
      setError("Failed to fetch company information. Is the backend running?");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const f = localStorage.getItem(`followed:${company}`);
      setFollowed(Boolean(f));
      const m = localStorage.getItem("application_materials");
      setMaterials(m ? JSON.parse(m) : []);
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }, [company]);

  function categorizeNews(title: string = "", desc: string = "") {
    try {
      const text = ((title || "") + " " + (desc || "")).toLowerCase();
      if (/fund|raise|series|invest|funding|ipo|public|stock|equity/.test(text)) return "Funding";
      if (/launch|release|product|version|announce|new|feature/.test(text)) return "Product";
      if (/hire|hiring|recruit|headcount|layoff|job|recruitment|employee|staff/.test(text)) return "Hiring";
      if (/acquir|merge|partnership|partner|deal|acquisition/.test(text)) return "M&A";
      if (/award|recognition|win|honor|achievement|leadership|executive/.test(text)) return "Awards";
      return "General";
    } catch (e) {
      return "General";
    }
  }

  function relevanceScore(item: any = {}) {
    try {
      let score = 50;
      if (item?.title && typeof item.title === "string" && item.title.toLowerCase().includes(company.toLowerCase())) score += 20;
      if (item?.description && typeof item.description === "string" && item.description.length > 200) score += 10;
      if (item?.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          const days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
          if (days < 3) score += 15;
          else if (days < 30) score += 5;
        }
      }
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (e) {
      return 50;
    }
  }

  function summarize(text: string = "") {
    try {
      if (!text || typeof text !== "string") return "No summary available.";
      const sentences = text.split(/(?<=\.|!|\?)\s+/).filter(Boolean);
      return sentences.slice(0, 3).join(" ") || "No summary available.";
    } catch (e) {
      return (text || "").substring(0, 200) + "...";
    }
  }

  function sourceFromLink(link: string | undefined) {
    if (!link || typeof link !== "string") return "unknown";
    try {
      const u = new URL(link);
      return u.hostname.replace("www.", "") || "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  function toggleFollow() {
    try {
      const next = !followed;
      setFollowed(next);
      if (next) localStorage.setItem(`followed:${company}`, "1");
      else localStorage.removeItem(`followed:${company}`);
    } catch (e) {
      console.error("Follow toggle error:", e);
    }
  }

  function addToMaterials(article: any) {
    try {
      const entry = {
        company,
        title: article?.title || "Untitled",
        date: article?.date || "",
        source: sourceFromLink(article?.link),
        summary: summarize(article?.description || article?.title || ""),
        link: article?.link || "",
      };
      const next = [entry, ...materials];
      setMaterials(next);
      localStorage.setItem("application_materials", JSON.stringify(next));
    } catch (e) {
      console.error("Add to materials error:", e);
    }
  }

  function exportNews() {
    try {
      if (!result || !Array.isArray(result.news)) return;
      const payload = result.news.slice(0, 5).map((n: any) => ({
        title: n?.title || "Untitled",
        date: n?.date || "",
        source: sourceFromLink(n?.link),
        category: categorizeNews(n?.title || "", n?.description || ""),
        summary: summarize(n?.description || n?.title || ""),
        link: n?.link || "",
      }));
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${company || "company"}-news.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "auto" }}>
      <h2 style={{ marginBottom: "1rem", textAlign: "center", color: "black" }}>Company Research</h2>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter company name..."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={{
            padding: "10px",
            width: "65%",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginRight: "8px",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {result && (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <h3 style={{ color: "#007bff", marginBottom: "1rem" }}>{result.name}</h3>

              <section style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "black" }}>Basic Company Information</h4>
                <p><strong>Industry:</strong> {result.industry || "N/A"}</p>
                <p><strong>Size:</strong> {result.employees || "N/A"}</p>
                <p><strong>Headquarters:</strong> {result.headquarters || "N/A"}</p>
              </section>

              <section style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "black" }}>Description</h4>
                <p>{result.mission || result.description || "No description available."}</p>
              </section>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: 8 }}>
                <h4 style={{ color: "black", margin: 0 }}>Recent News</h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={toggleFollow} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                    {followed ? "Following" : "Follow"}
                  </button>
                  <button onClick={exportNews} disabled={!result?.news || result.news.length === 0} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", opacity: !result?.news || result.news.length === 0 ? 0.5 : 1 }}>Export All</button>
                </div>
              </div>

              {result.news && result.news.length > 0 ? (
                <div style={{ marginBottom: "1rem" }}>
                  {(() => {
                    try {
                      const categories = ["Funding", "Product", "Hiring", "M&A", "Awards", "General"];
                      const grouped: { [key: string]: any[] } = {};
                      
                      result.news.slice(0, 5).forEach((n: any) => {
                        const title = n?.title || "Untitled";
                        const desc = n?.description || "";
                        const category = categorizeNews(title, desc);
                        if (!grouped[category]) grouped[category] = [];
                        grouped[category].push({ ...n, category });
                      });

                      return categories.map((cat) => {
                        if (!grouped[cat] || grouped[cat].length === 0) return null;
                        
                        return (
                          <div key={cat} style={{ marginBottom: "1.5rem" }}>
                            <h5 style={{ margin: "0 0 0.75rem 0", fontSize: 16, fontWeight: 600, color: "black" }}>
                              {cat}
                            </h5>
                            
                            <div style={{ display: "grid", gap: 12 }}>
                              {grouped[cat].map((n: any, i: number) => {
                                try {
                                  const title = n?.title || "Untitled";
                                  const desc = n?.description || "";
                                  const score = relevanceScore(n);
                                  const summary = summarize(desc || title);
                                  const source = sourceFromLink(n?.link);
                                  
                                  return (
                                    <article key={i} style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          {n?.link && typeof n.link === "string" ? (
                                            <a href={n.link} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#0366d6", textDecoration: "none", wordBreak: "break-word" }}>
                                              {title}
                                            </a>
                                          ) : (
                                            <span style={{ fontWeight: 600 }}>{title}</span>
                                          )}
                                          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                                            <span>{n?.date || "Unknown date"}</span>
                                            <span style={{ margin: "0 6px" }}>•</span>
                                            <span>{source}</span>
                                          </div>
                                        </div>
                                        <div style={{ textAlign: "right", minWidth: 80 }}>
                                          <div style={{ fontSize: 12, color: "#333", fontWeight: 600 }}>Relevance</div>
                                          <div style={{ width: 60, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                                            <div style={{ width: `${score}%`, height: "100%", background: score > 66 ? "#2ecc71" : score > 33 ? "#f1c40f" : "#e74c3c" }} />
                                          </div>
                                          <div style={{ fontSize: 12 }}>{score}%</div>
                                        </div>
                                      </div>

                                      <p style={{ marginTop: 10, color: "#333", lineHeight: 1.5 }}>{summary}</p>

                                      <div style={{ marginTop: 8 }}>
                                        <strong style={{ fontSize: 13 }}>Key points:</strong>
                                        <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13 }}>
                                          {summary
                                            .split(/(?<=\.|!|\?)\s+/)
                                            .slice(0, 3)
                                            .filter(Boolean)
                                            .map((s, idx) => (
                                              <li key={idx}>{s.trim()}</li>
                                            ))}
                                        </ul>
                                      </div>

                                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                        <button
                                          onClick={() => addToMaterials(n)}
                                          style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                                        >
                                          Add to materials
                                        </button>
                                        <button
                                          onClick={() => {
                                            try {
                                              const blob = new Blob([summary], { type: "text/plain" });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement("a");
                                              a.href = url;
                                              a.download = `${company || "company"}-news-${i}.txt`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                            } catch (e) {
                                              console.error("Export summary error:", e);
                                            }
                                          }}
                                          style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                                        >
                                          Export summary
                                        </button>
                                      </div>
                                    </article>
                                  );
                                } catch (renderError) {
                                  console.error(`Error rendering article ${i}:`, renderError);
                                  return (
                                    <article key={i} style={{ background: "#fff", padding: 12, borderRadius: 8, color: "#c0392b" }}>
                                      Error rendering article. Check console for details.
                                    </article>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    } catch (e) {
                      console.error("Error grouping news:", e);
                      return <p style={{ color: "#c0392b" }}>Error organizing news by category</p>;
                    }
                  })()}
                </div>
              ) : (
                <p style={{ color: "#555", marginBottom: "1rem" }}>No recent news found.</p>
              )}

              <section style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "black" }}>Leadership</h4>
                <p>{result.keyPeople || "No key executives listed."}</p>
              </section>

              {result.products && result.products.length > 0 && (
                <section style={{ marginBottom: "1rem" }}>
                  <h4 style={{ color: "black" }}>Products/Services</h4>
                  <ul>
                    {result.products.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </section>
              )}

              {result.competitors && result.competitors.length > 0 && (
                <section style={{ marginBottom: "1rem" }}>
                  <h4>⚔️ Competitive Landscape</h4>
                  <ul>
                    {result.competitors.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "black" }}>Social Media</h4>
                {result.socialMedia ? (
                  <ul>
                    {Object.entries(result.socialMedia)
                      .filter(([_, v]) => v)
                      .map(([platform, link]: any, i) => (
                        <li key={i}>
                          <strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong>{" "}
                          <a href={link} target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No social media profiles found.</p>
                )}
              </section>

              <section>
                <h4 style={{ color: "black" }}>Summary</h4>
                <p>{result.summary || "No summary available."}</p>
              </section>

            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyResearch;
