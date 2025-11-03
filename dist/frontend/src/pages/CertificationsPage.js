import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = import.meta.env?.VITE_API_URL || 'http://localhost:3000';
export default function CertificationsPage() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ userId: 1, name: '', issuingOrganization: '', dateEarned: '', expirationDate: '', doesNotExpire: false, certificationNumber: '', documentUrl: '' });
    useEffect(() => {
        axios.get(`${API}/certifications/user/1`).then((r) => setItems(r.data)).catch(() => { });
    }, []);
    return (React.createElement("div", { style: { padding: 20 } },
        React.createElement("h2", null, "Certifications"),
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("h3", null, "Add certification"),
            React.createElement("input", { placeholder: "Name", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
            ' ',
            React.createElement("input", { placeholder: "Organization", value: form.issuingOrganization, onChange: (e) => setForm({ ...form, issuingOrganization: e.target.value }) }),
            ' ',
            React.createElement("input", { type: "date", value: form.dateEarned, onChange: (e) => setForm({ ...form, dateEarned: e.target.value }) }),
            ' ',
            React.createElement("button", { onClick: () => { axios.post(`${API}/certifications`, form).then(() => axios.get(`${API}/certifications/user/1`).then((r) => setItems(r.data))); } }, "Add")),
        React.createElement("ul", null, items.map((c) => (React.createElement("li", { key: c.id, style: { marginBottom: 8 } },
            React.createElement("strong", null, c.name),
            " \u2014 ",
            c.issuingOrganization,
            React.createElement("br", null),
            "Earned: ",
            c.dateEarned?.slice(0, 10),
            " ",
            c.doesNotExpire ? '(Does not expire)' : c.expirationDate ? `- Expires ${c.expirationDate?.slice(0, 10)}` : '',
            c.certificationNumber && React.createElement("div", null,
                "ID: ",
                c.certificationNumber),
            c.documentUrl && React.createElement("div", null,
                React.createElement("a", { href: c.documentUrl, target: "_blank" }, "View document")),
            React.createElement("div", null,
                "Status: ",
                c.verificationStatus),
            React.createElement("div", { style: { marginTop: 6 } },
                React.createElement("button", { onClick: () => {
                        if (!confirm('Delete this certification?'))
                            return;
                        axios.delete(`${API}/certifications/${c.id}`).then(() => axios.get(`${API}/certifications/user/1`).then((r) => setItems(r.data)));
                    } }, "Delete"))))))));
}
//# sourceMappingURL=CertificationsPage.js.map