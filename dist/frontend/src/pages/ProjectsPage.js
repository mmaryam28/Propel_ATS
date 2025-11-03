import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = import.meta.env?.VITE_API_URL || 'http://localhost:3000';
export default function ProjectsPage() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ userId: 1, name: '', description: '', startDate: '', endDate: '', technologies: [] });
    useEffect(() => {
        axios.get(`${API}/projects/user/1`).then((r) => setItems(r.data)).catch(() => { });
    }, []);
    return (React.createElement("div", { style: { padding: 20 } },
        React.createElement("h2", null, "Projects"),
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("h3", null, "Add project"),
            React.createElement("input", { placeholder: "Name", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
            ' ',
            React.createElement("input", { placeholder: "Description", value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) }),
            ' ',
            React.createElement("input", { type: "date", value: form.startDate, onChange: (e) => setForm({ ...form, startDate: e.target.value }) }),
            ' ',
            React.createElement("button", { onClick: () => { axios.post(`${API}/projects`, form).then(() => axios.get(`${API}/projects/user/1`).then((r) => setItems(r.data))); } }, "Add")),
        React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 } }, items.map((p) => (React.createElement("div", { key: p.id, style: { border: '1px solid #ddd', padding: 12 } },
            React.createElement("h3", null, p.name),
            React.createElement("div", null, p.description),
            React.createElement("div", { style: { marginTop: 8 } },
                React.createElement("strong", null, "Status:"),
                " ",
                p.status),
            p.url && React.createElement("div", null,
                React.createElement("a", { href: p.url, target: "_blank" }, "Visit")),
            React.createElement("div", { style: { marginTop: 6 } },
                React.createElement("button", { onClick: () => {
                        if (!confirm('Delete this project?'))
                            return;
                        axios.delete(`${API}/projects/${p.id}`).then(() => axios.get(`${API}/projects/user/1`).then((r) => setItems(r.data)));
                    } }, "Delete"))))))));
}
//# sourceMappingURL=ProjectsPage.js.map