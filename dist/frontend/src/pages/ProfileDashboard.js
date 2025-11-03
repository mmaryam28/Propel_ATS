import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = import.meta.env?.VITE_API_URL || 'http://localhost:3000';
function fmtDate(d) {
    if (!d)
        return null;
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime()))
            return null;
        return dt.toISOString().slice(0, 10);
    }
    catch {
        return null;
    }
}
export default function ProfileDashboard() {
    const [overview, setOverview] = useState(null);
    useEffect(() => {
        axios
            .get(`${API}/profile/overview?userId=1`)
            .then((res) => setOverview(res.data))
            .catch(() => setOverview({}));
    }, []);
    if (!overview)
        return React.createElement("div", null, "Loading dashboard...");
    const educList = overview.recent?.education ?? [];
    const projList = overview.recent?.projects ?? [];
    const summary = overview.summary ?? {};
    const score = overview.completion?.score ?? 0;
    return (React.createElement("div", { style: { padding: 20 } },
        React.createElement("h2", null, "Profile Overview"),
        React.createElement("div", { style: { display: 'flex', gap: 12 } },
            React.createElement("div", { style: { border: '1px solid #ddd', padding: 12 } },
                React.createElement("h4", null, "Education"),
                React.createElement("p", null,
                    summary.educationCount ?? 0,
                    " entries")),
            React.createElement("div", { style: { border: '1px solid #ddd', padding: 12 } },
                React.createElement("h4", null, "Certifications"),
                React.createElement("p", null,
                    summary.certificationCount ?? 0,
                    " entries")),
            React.createElement("div", { style: { border: '1px solid #ddd', padding: 12 } },
                React.createElement("h4", null, "Projects"),
                React.createElement("p", null,
                    summary.projectCount ?? 0,
                    " entries"))),
        React.createElement("h3", { style: { marginTop: 20 } }, "Recent"),
        React.createElement("section", null,
            React.createElement("h4", null, "Education"),
            React.createElement("ul", null, educList.map((e) => (React.createElement("li", { key: e.id },
                e.degree,
                " \u2014 ",
                e.institution,
                " (",
                fmtDate(e.startDate) ?? 'N/A',
                " - ",
                fmtDate(e.endDate) ?? 'Ongoing',
                ")"))))),
        React.createElement("section", null,
            React.createElement("h4", null, "Projects"),
            React.createElement("ul", null, projList.map((p) => (React.createElement("li", { key: p.id },
                p.name,
                " \u2014 ",
                p.status ?? 'Unknown'))))),
        React.createElement("div", { style: { marginTop: 20 } },
            React.createElement("h4", null, "Profile Strength"),
            React.createElement("div", { style: { width: 300, background: '#eee' } },
                React.createElement("div", { style: { width: `${Math.min(100, Math.max(0, score))}%`, background: '#4caf50', color: '#fff', padding: 8 } },
                    score,
                    "%")))));
}
//# sourceMappingURL=ProfileDashboard.js.map