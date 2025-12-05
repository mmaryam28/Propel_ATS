import React, { useState } from "react";
import axios from "axios";
import { generateSalaryAnalytics } from "../../lib/api";

const SalaryAnalysis: React.FC = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [benefits, setBenefits] = useState("");
  const [currentSalary, setCurrentSalary] = useState<number | "">("");
  const [bonusPercentage, setBonusPercentage] = useState<number | "">(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [salaryRanges, setSalaryRanges] = useState<any>(null);
  const [totalCompensation, setTotalCompensation] = useState<any>(null);
  const [companyComparison, setCompanyComparison] = useState<any>(null);
  const [salaryTrends, setSalaryTrends] = useState<any>(null);
  const [negotiationAdvice, setNegotiationAdvice] = useState<any>(null);
  const [salaryComparison, setSalaryComparison] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("ranges");

  const handleGetSalaryRanges = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:3000/salary/ranges", {
        params: { 
          title, 
          location: location || undefined, 
          experienceLevel: experienceLevel || undefined,
          benefits: benefits || undefined,
        },
      });
      setSalaryRanges(response.data);
    } catch (err) {
      console.error("Error fetching salary ranges:", err);
      setError("Failed to fetch salary ranges");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTotalCompensation = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:3000/salary/total-compensation", {
        params: { 
          title, 
          location: location || undefined, 
          experienceLevel: experienceLevel || undefined,
          benefits: benefits || undefined,
        },
      });
      setTotalCompensation(response.data);
    } catch (err) {
      console.error("Error fetching total compensation:", err);
      setError("Failed to fetch total compensation data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompareCompanies = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:3000/salary/compare-companies", {
        params: { 
          title, 
          location: location || undefined,
          benefits: benefits || undefined,
        },
      });
      setCompanyComparison(response.data);
    } catch (err) {
      console.error("Error comparing companies:", err);
      setError("Failed to compare company salaries");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTrends = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:3000/salary/trends", {
        params: { title, location: location || undefined },
      });
      setSalaryTrends(response.data);
    } catch (err) {
      console.error("Error fetching trends:", err);
      setError("Failed to fetch salary trends");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        title,
        location: location || undefined,
        experienceLevel: experienceLevel || undefined,
        benefits: benefits || undefined,
      };

      const [rangesRes, compensationRes, companiesRes, trendsRes] = await Promise.all([
        axios.get("http://localhost:3000/salary/ranges", { params }),
        axios.get("http://localhost:3000/salary/total-compensation", { params }),
        axios.get("http://localhost:3000/salary/compare-companies", { 
          params: { title, location: location || undefined, benefits: benefits || undefined } 
        }),
        axios.get("http://localhost:3000/salary/trends", { 
          params: { title, location: location || undefined } 
        }),
      ]);

      setSalaryRanges(rangesRes.data);
      setTotalCompensation(compensationRes.data);
      setCompanyComparison(companiesRes.data);
      setSalaryTrends(trendsRes.data);

      if (currentSalary !== "") {
        try {
          const [negotiationRes, comparisonRes] = await Promise.all([
            axios.post("http://localhost:3000/salary/negotiation-recommendations", {
              title,
              currentSalary: Number(currentSalary),
              location: location || undefined,
              experienceLevel: experienceLevel || undefined,
            }),
            axios.post("http://localhost:3000/salary/compare-with-current", {
              title,
              userCurrentSalary: Number(currentSalary),
              userBonusPercentage: bonusPercentage ? Number(bonusPercentage) : undefined,
            }),
          ]);

          console.log('📊 Negotiation advice:', negotiationRes.data);
          console.log('📊 Salary comparison:', comparisonRes.data);
          setNegotiationAdvice(negotiationRes.data);
          setSalaryComparison(comparisonRes.data);
        } catch (err) {
          console.error("Error fetching salary comparison data:", err);
        }
      }

      // UC-100: Fetch personalized analytics
      try {
        const analyticsData = await generateSalaryAnalytics({
          title,
          location: location || undefined,
          experienceLevel: experienceLevel || undefined,
          currentSalary: currentSalary !== "" ? Number(currentSalary) : undefined,
        });
        setUserAnalytics(analyticsData);
      } catch (err) {
        console.error("Error fetching user analytics:", err);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate salary report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetNegotiationAdvice = async () => {
    if (!title.trim() || currentSalary === "") {
      setError("Please enter a job title and current salary");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:3000/salary/negotiation-recommendations", {
        title,
        currentSalary: Number(currentSalary),
        location: location || undefined,
        experienceLevel: experienceLevel || undefined,
      });
      setNegotiationAdvice(response.data);
    } catch (err) {
      console.error("Error getting negotiation advice:", err);
      setError("Failed to get negotiation recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSalary = async () => {
    if (!title.trim() || currentSalary === "") {
      setError("Please enter a job title and current salary");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:3000/salary/compare-with-current", {
        title,
        userCurrentSalary: Number(currentSalary),
        userBonusPercentage: bonusPercentage ? Number(bonusPercentage) : undefined,
      });
      console.log('📊 Salary comparison (standalone):', response.data);
      setSalaryComparison(response.data);
    } catch (err) {
      console.error("Error comparing salary:", err);
      setError("Failed to compare salary");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!title.trim()) {
      setError("Please enter a job title");
      return;
    }
    try {
      const response = await axios.get("http://localhost:3000/salary/export", {
        params: { title, location: location || undefined, format: "json" },
      });
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}-salary-report.json`;
      link.click();
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export salary report");
    }
  };

  const renderSalaryRange = (data: any) => {
    if (!data || !data.range) return null;
    const range = data.range;
    return (
      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <h3 style={{ color: "black", marginBottom: "1rem" }}>Salary Range for {data.title || title}</h3>
        {data.location && <p style={{ color: "#666", marginBottom: "1rem" }}>Location: {data.location}</p>}
        {data.experienceLevel && <p style={{ color: "#666", marginBottom: "1rem" }}>Experience: {data.experienceLevel}</p>}
        
        {range.min !== undefined && range.max !== undefined && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff", marginBottom: "0.5rem" }}>
              ${range.min?.toLocaleString()} - ${range.max?.toLocaleString()}
            </div>
            <div style={{ background: "#eee", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(to right, #2ecc71, #f1c40f, #e74c3c)",
                  width: "100%",
                }}
              />
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "1rem" }}>
          {range.avg !== undefined && (
            <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Average</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                ${range.avg?.toLocaleString()}
              </div>
            </div>
          )}
          {range.median !== undefined && (
            <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Median</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                ${range.median?.toLocaleString()}
              </div>
            </div>
          )}
          {range.p25 !== undefined && (
            <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>25th Percentile</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>
                ${range.p25?.toLocaleString()}
              </div>
            </div>
          )}
          {range.p75 !== undefined && (
            <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>75th Percentile</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#e74c3c" }}>
                ${range.p75?.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCompensationBreakdown = (data: any) => {
    if (!data || !data.breakdown) return null;
    const breakdown = data.breakdown;
    const compensation = data.compensation;
    
    return (
      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <h3 style={{ color: "black", marginBottom: "1rem" }}>Total Compensation Breakdown</h3>
        {data.title && <p style={{ color: "#666", marginBottom: "1rem" }}>Position: {data.title}</p>}
        {data.location && <p style={{ color: "#666", marginBottom: "1rem" }}>Location: {data.location}</p>}
        
        <div style={{ display: "grid", gap: "12px" }}>
          {breakdown.avgBase !== undefined && !isNaN(breakdown.avgBase) && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
              <span>Average Base Salary:</span>
              <span style={{ fontWeight: "bold" }}>${Number(breakdown.avgBase)?.toLocaleString()}</span>
            </div>
          )}
          
          {compensation && (
            <>
              <div style={{ marginTop: "1rem", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
                Salary Range
              </div>
              {compensation.min !== undefined && compensation.max !== undefined && !isNaN(compensation.min) && !isNaN(compensation.max) && (
                <div style={{ padding: "10px", background: "#d4edda", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Minimum:</span>
                    <span style={{ fontWeight: "bold", color: "#155724" }}>${Number(compensation.min)?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Average:</span>
                    <span style={{ fontWeight: "bold", color: "#155724" }}>${Number(compensation.avg)?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Maximum:</span>
                    <span style={{ fontWeight: "bold", color: "#155724" }}>${Number(compensation.max)?.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {data.commonBenefits && data.commonBenefits.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
                Common Benefits
              </div>
              <div style={{ padding: "10px", background: "#fff", borderRadius: "6px" }}>
                <span style={{ color: "#666" }}>{data.commonBenefits.join(", ")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCompanyComparison = (data: any) => {
    if (!data || !data.companies || data.companies.length === 0) return null;
    
    const allSalaries = data.companies.map((c: any) => c.avgSalary).filter((s: number) => s !== undefined);
    const minOverall = Math.min(...allSalaries);
    const maxOverall = Math.max(...allSalaries);
    
    return (
      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <h3 style={{ color: "black", marginBottom: "1rem" }}>Company Salary Comparison</h3>
        {data.title && <p style={{ color: "#666", marginBottom: "1rem" }}>Position: {data.title}</p>}
        {data.location && <p style={{ color: "#666", marginBottom: "1rem" }}>Location: {data.location}</p>}
        
        <div style={{ display: "grid", gap: "12px" }}>
          {data.companies.map((company: any, idx: number) => (
            <div key={idx} style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>{company.company}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>({company.count} records)</div>
              </div>
              
              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                  Average Salary: <span style={{ fontWeight: "bold", color: "#007bff" }}>${company.avgSalary?.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Benefits:</div>
                  <div style={{ color: company.benefits && company.benefits.trim() !== '' ? "#28a745" : "#999", fontSize: "13px" }}>
                    {company.benefits && company.benefits.trim() !== '' ? company.benefits : "No benefits data available"}
                  </div>
                </div>
              </div>
              
              <div style={{ background: "#eee", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: "#007bff",
                    width: maxOverall > minOverall ? `${((company.avgSalary - minOverall) / (maxOverall - minOverall)) * 100}%` : "100%",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

    const renderNegotiationPrep = () => {
    // Show if we have negotiation data OR if we have salary ranges + current salary
    const hasNegotiationData = negotiationAdvice || salaryComparison || userAnalytics;
    const hasSalaryData = salaryRanges && currentSalary !== "";
    
    if (!hasNegotiationData && !hasSalaryData) return null;

    const roleLabel = title || "this role";
    const locationLabel = location || "your location";

    const marketAvg =
      negotiationAdvice?.marketAverage ??
      salaryComparison?.marketComparison?.total ??
      salaryRanges?.range?.avg ??
      null;

    const userTotalComp =
      (salaryComparison?.userCompensation?.total ?? currentSalary) || null;

    return (
      <div
        style={{
          background: "#fff7e6",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #ffe8b2",
          marginTop: "1.5rem",
        }}
      >
        <h2
          style={{
            color: "#d35400",
            marginBottom: "1rem",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          Salary Negotiation Preparation Playbook
        </h2>

        {/* 1. Quick snapshot */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              padding: "12px",
              background: "#fff",
              borderRadius: "6px",
              borderLeft: "4px solid #f39c12",
            }}
          >
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              Role / Location
            </div>
            <div style={{ fontWeight: "bold", color: "#333" }}>
              {roleLabel} • {locationLabel}
            </div>
          </div>

          {marketAvg !== null && (
            <div
              style={{
                padding: "12px",
                background: "#fff",
                borderRadius: "6px",
                borderLeft: "4px solid #3498db",
              }}
            >
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Market Benchmark (Total)
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#3498db",
                  fontSize: "16px",
                }}
              >
                ${Number(marketAvg).toLocaleString()}
              </div>
            </div>
          )}

          {userTotalComp !== null && (
            <div
              style={{
                padding: "12px",
                background: "#fff",
                borderRadius: "6px",
                borderLeft: "4px solid #27ae60",
              }}
            >
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                Your Current / Offered Total
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  color: "#27ae60",
                  fontSize: "16px",
                }}
              >
                ${Number(userTotalComp).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* 2. Talking points based on data */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Negotiation Talking Points
          </h3>
          <p style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
            Use these data-backed points when discussing compensation:
          </p>
          <ul style={{ paddingLeft: "1.1rem", fontSize: "13px", color: "#333" }}>
            {negotiationAdvice?.percentageDifference !== undefined && negotiationAdvice?.percentageDifference !== null && (
              <li style={{ marginBottom: "4px" }}>
                Your current pay is{" "}
                <strong>
                  {Number(negotiationAdvice.percentageDifference) >= 0 ? "+" : ""}
                  {Number(negotiationAdvice.percentageDifference)}%
                </strong>{" "}
                {Number(negotiationAdvice.percentageDifference) >= 0
                  ? "above"
                  : "below"}{" "}
                the market average for {roleLabel} in {locationLabel}.
              </li>
            )}
            {salaryComparison?.differences?.totalDiff !== undefined && salaryComparison?.differences?.totalDiff !== null && (
              <li style={{ marginBottom: "4px" }}>
                The market total compensation is{" "}
                <strong>
                  {salaryComparison.differences.totalDiff >= 0 ? "+" : ""}
                  $
                  {Number(salaryComparison.differences.totalDiff).toLocaleString()}
                </strong>{" "}
                {salaryComparison.differences.totalDiff >= 0
                  ? "higher than"
                  : "lower than"}{" "}
                your current/offer package.
              </li>
            )}
            {totalCompensation?.breakdown?.avgBase !== undefined && (
              <li style={{ marginBottom: "4px" }}>
                Similar roles report an average base of{" "}
                <strong>
                  $
                  {Number(
                    totalCompensation.breakdown.avgBase
                  ).toLocaleString()}
                </strong>{" "}
                and benefits around{" "}
                <strong>
                  $
                  {Number(
                    totalCompensation.breakdown.avgBenefits || 0
                  ).toLocaleString()}
                </strong>
                .
              </li>
            )}
            <li style={{ marginBottom: "4px" }}>
              Highlight your experience level (
              {experienceLevel || "your experience"}), recent accomplishments,
              and impact to justify being closer to the{" "}
              <strong>75th percentile</strong> of the range.
            </li>
          </ul>
        </div>

        {/* 3. Total compensation evaluation framework */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Total Compensation Evaluation Framework
          </h3>
          <p style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
            Use this checklist when reviewing an offer:
          </p>
          <ul style={{ paddingLeft: "1.1rem", fontSize: "13px", color: "#333" }}>
            <li>Base salary vs. market median and 75th percentile.</li>
            <li>Bonus percentage and typical payout reliability.</li>
            <li>Equity / RSUs / stock purchase plans.</li>
            <li>Benefits value: health, dental, 401k match, PTO, education.</li>
            <li>Remote/hybrid flexibility and commute cost/time.</li>
            <li>Growth potential: promotion track, title, scope.</li>
          </ul>
          <p style={{ fontSize: "12px", color: "#777", marginTop: "6px" }}>
            You can combine your numbers with the{" "}
            <strong>“Your Salary Comparison”</strong> card above to compute a
            realistic counteroffer range.
          </p>
        </div>

        {/* 4. Scenario scripts */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Sample Scripts for Common Scenarios
          </h3>

          <div style={{ display: "grid", gap: "8px" }}>
            <div
              style={{
                padding: "10px",
                background: "#fdf2e9",
                borderRadius: "6px",
                borderLeft: "3px solid #f39c12",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                1. Initial Offer – Asking Above Market Median
              </div>
              <div style={{ fontSize: "12px", color: "#555" }}>
                “Thank you again for the offer for the {roleLabel} position. Based
                on my research for similar roles in {locationLabel} and my
                experience in [your key achievements], I was expecting a total
                compensation closer to $
                {marketAvg ? Number(marketAvg).toLocaleString() : "____"}.
                Is there flexibility to move the base salary closer to that
                range?”
              </div>
            </div>

            <div
              style={{
                padding: "10px",
                background: "#fdf2e9",
                borderRadius: "6px",
                borderLeft: "3px solid #e67e22",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                2. Counteroffer – When You Have Another Offer
              </div>
              <div style={{ fontSize: "12px", color: "#555" }}>
                “I am very excited about {roleLabel} at your team. I do have
                another offer at $
                {userTotalComp
                  ? Number(userTotalComp).toLocaleString()
                  : "____"}{" "}
                total comp. If we could get closer to that number, I would feel
                confident accepting your offer.”
              </div>
            </div>

            <div
              style={{
                padding: "10px",
                background: "#fdf2e9",
                borderRadius: "6px",
                borderLeft: "3px solid #d35400",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                3. Non-Salary Compensation Focus
              </div>
              <div style={{ fontSize: "12px", color: "#555" }}>
                “If there is limited room to move on base salary, I’d love to
                explore adjusting other parts of the package such as bonus,
                equity, or additional PTO to make the overall compensation more
                aligned with market.”
              </div>
            </div>
          </div>
        </div>

        {/* 5. Timing strategies */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Timing Strategy for Salary Discussions
          </h3>
          <ul style={{ paddingLeft: "1.1rem", fontSize: "13px", color: "#333" }}>
            <li>
              Wait until you have a{" "}
              <strong>formal written offer</strong> before negotiating salary.
            </li>
            <li>
              If pressed early, say: “I’m happy to discuss ranges, but I’d love
              to learn more about the role and expectations first.”
            </li>
            {userAnalytics?.timingInsights?.bestQuarter && (
              <li>
                Your historical best period for offers has been{" "}
                <strong>{userAnalytics.timingInsights.bestQuarter}</strong>.
                Use that as a signal for future job search planning.
              </li>
            )}
            <li>
              Aim to respond to an offer within{" "}
              <strong>2–3 business days</strong> after doing your research and
              preparing talking points.
            </li>
          </ul>
        </div>

        {/* 6. Counteroffer evaluation template */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Counteroffer Evaluation Template
          </h3>
          <p style={{ fontSize: "12px", color: "#555", marginBottom: "6px" }}>
            Plug in your numbers below while reviewing an offer:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "8px",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                padding: "8px",
                background: "#fdf2e9",
                borderRadius: "6px",
              }}
            >
              <strong>Target Base Salary</strong>
              <div>
                Use:
                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                  <li>
                    Median:{" "}
                    {negotiationAdvice?.marketRange?.median
                      ? `$${negotiationAdvice.marketRange.median.toLocaleString()}`
                      : "your research"}
                  </li>
                  <li>
                    Or 75th percentile:{" "}
                    {negotiationAdvice?.marketRange?.p75
                      ? `$${negotiationAdvice.marketRange.p75.toLocaleString()}`
                      : "stretch target"}
                  </li>
                </ul>
              </div>
            </div>
            <div
              style={{
                padding: "8px",
                background: "#fdf2e9",
                borderRadius: "6px",
              }}
            >
              <strong>Walk-Away Number</strong>
              <div>
                Decide the minimum you would accept after considering:
                title, growth, and risk.
              </div>
            </div>
          </div>
        </div>

        {/* 7. Confidence-building exercises */}
        <div
          style={{
            marginTop: "1rem",
            padding: "12px",
            background: "#fff",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              color: "#d35400",
              marginBottom: "0.5rem",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Confidence-Building Exercises
          </h3>
          <ul style={{ paddingLeft: "1.1rem", fontSize: "13px", color: "#333" }}>
            <li>Write down 3 recent achievements that had measurable impact.</li>
            <li>
              Practice your negotiation script out loud 2–3 times, ideally with
              a friend or mock interviewer.
            </li>
            <li>
              Rehearse saying your target number confidently and then staying
              silent while the other side responds.
            </li>
            <li>
              Remind yourself that negotiation is{" "}
              <strong>normal and expected</strong>, not ungrateful.
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "black", marginBottom: "2rem", textAlign: "center" }}>Salary Analysis Tool</h1>

      {error && (
        <div style={{ padding: "12px", background: "#fadbd8", color: "#c0392b", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "black", marginBottom: "1rem" }}>Search Parameters</h3>
        <div style={{ display: "grid", gap: "12px", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Location (Optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, New York"
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
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Experience Level (Optional)</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="">-- Select --</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Benefits Looking For (Optional)</label>
            <input
              type="text"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="e.g., 401k, health insurance, remote work"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Enter keywords to filter by specific benefits
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Your Current Salary (Optional)</label>
              <input
                type="number"
                value={currentSalary}
                onChange={(e) => setCurrentSalary(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g., 100000"
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
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>Bonus % (Optional)</label>
              <input
                type="number"
                value={bonusPercentage}
                onChange={(e) => setBonusPercentage(e.target.value ? Number(e.target.value) : 0)}
                placeholder="e.g., 20"
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            style={{
              padding: "14px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

          <button
            onClick={handleExportReport}
            disabled={loading || !salaryRanges}
            style={{
              padding: "14px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading || !salaryRanges ? "not-allowed" : "pointer",
              opacity: loading || !salaryRanges ? 0.6 : 1,
              fontWeight: "600",
              fontSize: "16px",
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", color: "#666" }}>Loading...</div>}

      {/* UC-100: Personalized Analytics - Moved to top */}
      <div style={{ background: "#f0f8ff", padding: "1.5rem", borderRadius: "8px", marginTop: "2rem", border: "2px solid #007bff" }}>
        <h2 style={{ color: "#007bff", marginBottom: "1.5rem", fontSize: "24px", fontWeight: "bold" }}>
          📊 Your Personalized Salary Analytics
        </h2>

        {!userAnalytics && !loading && (
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📊</div>
            <div style={{ fontSize: "18px", color: "#666", marginBottom: "1rem" }}>
              Click "Generate Report" above to see your personalized analytics
            </div>
            <div style={{ fontSize: "14px", color: "#999" }}>
              Based on your job applications and salary data
            </div>
          </div>
        )}

        {userAnalytics && (
          <>
            {/* Salary Progression */}
            {userAnalytics.salaryProgression && userAnalytics.salaryProgression.length > 0 && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>💰 Salary Offers Over Time</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {userAnalytics.salaryProgression.map((offer: any, idx: number) => (
                    <div key={idx} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", borderLeft: offer.negotiated ? "4px solid #28a745" : "4px solid #6c757d" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>{offer.company}</div>
                          <div style={{ fontSize: "14px", color: "#666" }}>{offer.title} • {offer.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                            ${offer.baseSalary?.toLocaleString()}
                          </div>
                          {offer.increase !== 0 && (
                            <div style={{ fontSize: "12px", color: offer.increase > 0 ? "#28a745" : "#dc3545" }}>
                              {offer.increase > 0 ? "+" : ""}${offer.increase?.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {offer.negotiated && (
                        <div style={{ fontSize: "12px", color: "#28a745", marginTop: "4px" }}>✓ Negotiated</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Success */}
            {userAnalytics.negotiationSuccess && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>🤝 Negotiation Success</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "#e7f3ff", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#007bff" }}>
                      {userAnalytics.negotiationSuccess.rate}%
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Success Rate</div>
                  </div>
                  <div style={{ padding: "16px", background: "#d4edda", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#28a745" }}>
                      ${userAnalytics.negotiationSuccess.avgIncrease?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Avg. Increase</div>
                  </div>
                  <div style={{ padding: "16px", background: "#fff3cd", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#856404" }}>
                      {userAnalytics.negotiationSuccess.totalNegotiated}/{userAnalytics.negotiationSuccess.totalOffers}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Negotiated Offers</div>
                  </div>
                </div>
              </div>
            )}

            {/* Career Progression */}
            {userAnalytics.careerProgression && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>📈 Career Progression Impact</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>Total Offers</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                      {userAnalytics.careerProgression.totalOffers}
                    </div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>Avg. Increase</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>
                      ${Math.round(userAnalytics.careerProgression.avgIncrease)?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>Trend</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: userAnalytics.careerProgression.trending === "up" ? "#28a745" : "#6c757d" }}>
                      {userAnalytics.careerProgression.trending === "up" ? "📈 Up" : userAnalytics.careerProgression.trending === "flat" ? "➡️ Flat" : "📊 N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Market Positioning */}
            {userAnalytics.marketPositioning && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>🎯 Market Positioning</h3>
                <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#007bff", marginBottom: "12px" }}>
                    You are in the{" "}
                    {userAnalytics.marketPositioning.status === "top_25" && "top 25%"}
                    {userAnalytics.marketPositioning.status === "above_average" && "above average range"}
                    {userAnalytics.marketPositioning.status === "average" && "average range"}
                    {userAnalytics.marketPositioning.status === "below_average" && "below average range"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>Your Average</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                        ${userAnalytics.marketPositioning.userAvg?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>Market Average</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                        ${userAnalytics.marketPositioning.marketAvg?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", padding: "12px", background: userAnalytics.marketPositioning.percentDifference >= 0 ? "#d4edda" : "#f8d7da", borderRadius: "6px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: userAnalytics.marketPositioning.percentDifference >= 0 ? "#155724" : "#721c24" }}>
                      {userAnalytics.marketPositioning.percentDifference >= 0 ? "+" : ""}
                      {userAnalytics.marketPositioning.percentDifference}% {userAnalytics.marketPositioning.percentDifference >= 0 ? "above" : "below"} market
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timing Insights */}
            {userAnalytics.timingInsights && userAnalytics.timingInsights.bestQuarter && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>⏰ Timing Insights</h3>
                <div style={{ padding: "16px", background: "#fff3cd", borderRadius: "6px" }}>
                  <div style={{ fontSize: "16px", color: "#856404", marginBottom: "8px" }}>
                    <strong>Best time for offers:</strong> {userAnalytics.timingInsights.bestQuarter}
                  </div>
                  <div style={{ fontSize: "14px", color: "#856404" }}>
                    Average salary during this period: ${userAnalytics.timingInsights.bestQuarterAvg?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {userAnalytics.recommendations && userAnalytics.recommendations.length > 0 && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>💡 Recommendations</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {userAnalytics.recommendations.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        background: rec.priority === "high" ? "#fff5f5" : rec.priority === "medium" ? "#fffbf0" : "#f0f8ff",
                        borderRadius: "6px",
                        borderLeft: `4px solid ${rec.priority === "high" ? "#dc3545" : rec.priority === "medium" ? "#ffc107" : "#007bff"}`,
                      }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                        {rec.message}
                      </div>
                      <div style={{ fontSize: "13px", color: "#007bff", fontStyle: "italic" }}>
                        💡 {rec.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: "grid", gap: "1.5rem", marginTop: "2rem" }}>
        {salaryRanges && renderSalaryRange(salaryRanges)}
        {totalCompensation && renderCompensationBreakdown(totalCompensation)}
        {companyComparison && renderCompanyComparison(companyComparison)}

        {salaryTrends && (
          <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
            <h3 style={{ color: "black", marginBottom: "1rem" }}>Salary Trends</h3>
            {salaryTrends.title && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "1rem" }}>
                  {salaryTrends.title} in {salaryTrends.location || "Various Locations"}
                </div>
                {salaryTrends.trends && salaryTrends.trends.length > 0 ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {salaryTrends.trends.map((trend: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#fff",
                          borderRadius: "6px",
                          borderLeft: "4px solid #007bff",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "#333" }}>{trend.month}</div>
                          <div style={{ fontSize: "14px", color: "#666" }}>
                            Average: ${trend.avg !== undefined && !isNaN(trend.avg) ? Number(trend.avg).toLocaleString() : "N/A"}
                          </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                          ${trend.avg !== undefined && !isNaN(trend.avg) ? Number(trend.avg).toLocaleString() : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#666" }}>No trend data available.</p>
                )}
              </div>
            )}
          </div>
        )}

        {negotiationAdvice && (
          <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
            <h3 style={{ color: "black", marginBottom: "1rem" }}>Negotiation Recommendations</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {negotiationAdvice.title && (
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "0.5rem" }}>
                  {negotiationAdvice.title} in {negotiationAdvice.location || "Your Location"}
                </div>
              )}

              {negotiationAdvice.currentSalary !== undefined && (
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #ffc107" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>Your Current Salary</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ffc107" }}>
                    ${negotiationAdvice.currentSalary?.toLocaleString()}
                  </div>
                </div>
              )}

              {negotiationAdvice.marketAverage !== undefined && (
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #17a2b8" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>Market Average</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#17a2b8" }}>
                    ${negotiationAdvice.marketAverage?.toLocaleString()}
                  </div>
                </div>
              )}

              {negotiationAdvice.recommendedSalary !== undefined && (
                <div style={{ padding: "12px", background: "#d4edda", borderRadius: "6px", borderLeft: "4px solid #28a745" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#155724" }}>Recommended Salary</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                    ${negotiationAdvice.recommendedSalary?.toLocaleString()}
                  </div>
                </div>
              )}

              {negotiationAdvice.percentageDifference !== undefined && negotiationAdvice.percentageDifference !== null && (
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>Difference from Market</div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: negotiationAdvice.percentageDifference >= 0 ? "#28a745" : "#dc3545",
                    }}
                  >
                    {negotiationAdvice.percentageDifference >= 0 ? "+" : ""}
                    {negotiationAdvice.percentageDifference.toFixed(1)}%
                  </div>
                </div>
              )}

              {negotiationAdvice.negotiationStrategy && (
                <div style={{ padding: "12px", background: "#e7f3ff", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", color: "#004085" }}>Strategy</div>
                  <div style={{ color: "#004085", lineHeight: "1.6" }}>
                    {negotiationAdvice.negotiationStrategy}
                  </div>
                </div>
              )}

              {negotiationAdvice.marketRange && (
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #6f42c1" }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", color: "#333" }}>Market Range</div>
                  <div style={{ color: "#666" }}>
                    <div>Minimum: ${negotiationAdvice.marketRange.min?.toLocaleString()}</div>
                    <div>Maximum: ${negotiationAdvice.marketRange.max?.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {salaryComparison && (
          <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
            <h3 style={{ color: "black", marginBottom: "1rem" }}>Your Salary Comparison</h3>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {salaryComparison.title && (
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                  {salaryComparison.title}
                </div>
              )}

              {salaryComparison.userCompensation && (
                <div>
                  <h4 style={{ color: "#333", marginBottom: "0.75rem", fontSize: "16px" }}>Your Compensation</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {salaryComparison.userCompensation.baseSalary !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Base Salary:</span>
                        <span style={{ fontWeight: "bold" }}>
                          ${salaryComparison.userCompensation.baseSalary?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.userCompensation.bonus !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Bonus:</span>
                        <span style={{ fontWeight: "bold" }}>
                          ${salaryComparison.userCompensation.bonus?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.userCompensation.benefits !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Benefits:</span>
                        <span style={{ fontWeight: "bold" }}>
                          ${salaryComparison.userCompensation.benefits?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.userCompensation.total !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#e7f3ff", borderRadius: "6px", fontWeight: "bold" }}>
                        <span>Total:</span>
                        <span style={{ color: "#007bff" }}>
                          ${salaryComparison.userCompensation.total?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {salaryComparison.marketComparison && (
                <div>
                  <h4 style={{ color: "#333", marginBottom: "0.75rem", fontSize: "16px" }}>Market Comparison</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {salaryComparison.marketComparison.baseSalary !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Market Base Salary:</span>
                        <span style={{ fontWeight: "bold" }}>
                          ${salaryComparison.marketComparison.baseSalary?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.marketComparison.benefits !== undefined && salaryComparison.marketComparison.benefits !== null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Market Benefits:</span>
                        <span style={{ fontWeight: "bold" }}>
                          ${salaryComparison.marketComparison.benefits?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.marketComparison.total !== undefined && salaryComparison.marketComparison.total !== null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#d4edda", borderRadius: "6px", fontWeight: "bold" }}>
                        <span>Market Total:</span>
                        <span style={{ color: "#28a745" }}>
                          ${salaryComparison.marketComparison.total?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {salaryComparison.differences && (
                <div>
                  <h4 style={{ color: "#333", marginBottom: "0.75rem", fontSize: "16px" }}>Salary Differences</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {salaryComparison.differences.baseSalaryDiff !== undefined && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Base Salary Difference:</span>
                        <span style={{ fontWeight: "bold", color: salaryComparison.differences.baseSalaryDiff >= 0 ? "#28a745" : "#dc3545" }}>
                          {salaryComparison.differences.baseSalaryDiff >= 0 ? "+" : ""}
                          ${salaryComparison.differences.baseSalaryDiff?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.differences.benefitsDiff !== undefined && salaryComparison.differences.benefitsDiff !== null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#fff", borderRadius: "6px" }}>
                        <span>Benefits Difference:</span>
                        <span style={{ fontWeight: "bold", color: salaryComparison.differences.benefitsDiff >= 0 ? "#28a745" : "#dc3545" }}>
                          {salaryComparison.differences.benefitsDiff >= 0 ? "+" : ""}
                          ${salaryComparison.differences.benefitsDiff?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {salaryComparison.differences.totalDiff !== undefined && salaryComparison.differences.totalDiff !== null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: salaryComparison.differences.totalDiff >= 0 ? "#d4edda" : "#f8d7da", borderRadius: "6px", fontWeight: "bold" }}>
                        <span>Total Compensation Difference:</span>
                        <span style={{ color: salaryComparison.differences.totalDiff >= 0 ? "#155724" : "#721c24" }}>
                          {salaryComparison.differences.totalDiff >= 0 ? "+" : ""}
                          ${salaryComparison.differences.totalDiff?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {salaryComparison.percentageDifference !== undefined && salaryComparison.percentageDifference !== null && (
                <div style={{ padding: "12px", background: "#fff", borderRadius: "6px", borderLeft: "4px solid #007bff" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px", color: "#333" }}>Overall Percentage Difference</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: salaryComparison.percentageDifference >= 0 ? "#28a745" : "#dc3545" }}>
                    {salaryComparison.percentageDifference >= 0 ? "+" : ""}
                    {salaryComparison.percentageDifference.toFixed(1)}%
                    {salaryComparison.percentageDifference >= 0 ? " above market" : " below market"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UC-100: Personalized Analytics */}
        {userAnalytics && (
          <div style={{ background: "#f0f8ff", padding: "1.5rem", borderRadius: "8px", marginTop: "2rem", border: "2px solid #007bff" }}>
            <h2 style={{ color: "#007bff", marginBottom: "1.5rem", fontSize: "24px", fontWeight: "bold" }}>
              📊 Your Personalized Salary Analytics
            </h2>

            {/* Salary Progression */}
            {userAnalytics.salaryProgression && userAnalytics.salaryProgression.length > 0 && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>💰 Salary Offers Over Time</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {userAnalytics.salaryProgression.map((offer: any, idx: number) => (
                    <div key={idx} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px", borderLeft: offer.negotiated ? "4px solid #28a745" : "4px solid #6c757d" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>{offer.company}</div>
                          <div style={{ fontSize: "14px", color: "#666" }}>{offer.title} • {offer.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                            ${offer.baseSalary?.toLocaleString()}
                          </div>
                          {offer.increase !== 0 && (
                            <div style={{ fontSize: "12px", color: offer.increase > 0 ? "#28a745" : "#dc3545" }}>
                              {offer.increase > 0 ? "+" : ""}${offer.increase?.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {offer.negotiated && (
                        <div style={{ fontSize: "12px", color: "#28a745", marginTop: "4px" }}>✓ Negotiated</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Success */}
            {userAnalytics.negotiationSuccess && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>🤝 Negotiation Success</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "#e7f3ff", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#007bff" }}>
                      {userAnalytics.negotiationSuccess.rate}%
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Success Rate</div>
                  </div>
                  <div style={{ padding: "16px", background: "#d4edda", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#28a745" }}>
                      ${userAnalytics.negotiationSuccess.avgIncrease?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Avg. Increase</div>
                  </div>
                  <div style={{ padding: "16px", background: "#fff3cd", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#856404" }}>
                      {userAnalytics.negotiationSuccess.totalNegotiated}/{userAnalytics.negotiationSuccess.totalOffers}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>Negotiated Offers</div>
                  </div>
                </div>
              </div>
            )}

            {/* Market Positioning */}
            {userAnalytics.marketPositioning && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>🎯 Market Positioning</h3>
                <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "6px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#007bff", marginBottom: "12px" }}>
                    You are in the{" "}
                    {userAnalytics.marketPositioning.status === "top_25" && "top 25%"}
                    {userAnalytics.marketPositioning.status === "above_average" && "above average range"}
                    {userAnalytics.marketPositioning.status === "average" && "average range"}
                    {userAnalytics.marketPositioning.status === "below_average" && "below average range"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>Your Average</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                        ${userAnalytics.marketPositioning.userAvg?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", color: "#666" }}>Market Average</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                        ${userAnalytics.marketPositioning.marketAvg?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", padding: "12px", background: userAnalytics.marketPositioning.percentDifference >= 0 ? "#d4edda" : "#f8d7da", borderRadius: "6px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: userAnalytics.marketPositioning.percentDifference >= 0 ? "#155724" : "#721c24" }}>
                      {userAnalytics.marketPositioning.percentDifference >= 0 ? "+" : ""}
                      {userAnalytics.marketPositioning.percentDifference}% {userAnalytics.marketPositioning.percentDifference >= 0 ? "above" : "below"} market
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timing Insights */}
            {userAnalytics.timingInsights && userAnalytics.timingInsights.bestQuarter && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>⏰ Timing Insights</h3>
                <div style={{ padding: "16px", background: "#fff3cd", borderRadius: "6px" }}>
                  <div style={{ fontSize: "16px", color: "#856404", marginBottom: "8px" }}>
                    <strong>Best time for offers:</strong> {userAnalytics.timingInsights.bestQuarter}
                  </div>
                  <div style={{ fontSize: "14px", color: "#856404" }}>
                    Average salary during this period: ${userAnalytics.timingInsights.bestQuarterAvg?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {userAnalytics.recommendations && userAnalytics.recommendations.length > 0 && (
              <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem", fontSize: "18px" }}>💡 Recommendations</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {userAnalytics.recommendations.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        background: rec.priority === "high" ? "#fff5f5" : rec.priority === "medium" ? "#fffbf0" : "#f0f8ff",
                        borderRadius: "6px",
                        borderLeft: `4px solid ${rec.priority === "high" ? "#dc3545" : rec.priority === "medium" ? "#ffc107" : "#007bff"}`,
                      }}
                    >
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "8px" }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                        {rec.message}
                      </div>
                      <div style={{ fontSize: "13px", color: "#007bff", fontStyle: "italic" }}>
                        💡 {rec.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* UC-083: Negotiation preparation playbook */}
            {renderNegotiationPrep()}   
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryAnalysis;
