import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = import.meta.env?.VITE_API_URL || 'http://localhost:3000';
export default function EducationPage() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ userId: 1, degree: '', institution: '', startDate: '', endDate: '', ongoing: false, gpa: '', showGpa: true, honors: [] });
    function resetForm() {
        setForm({ userId: 1, degree: '', institution: '', startDate: '', endDate: '', ongoing: false, gpa: '', showGpa: true, honors: [] });
    }
    useEffect(() => {
        axios.get(`${API}/education/user/1`).then((r) => setItems(r.data)).catch(() => { });
    }, []);
    return (React.createElement("div", { style: { padding: 20 } },
        React.createElement("h2", null, "Education"),
        React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("h3", null, "Add education"),
            React.createElement("input", { placeholder: "Degree", value: form.degree, onChange: (e) => setForm({ ...form, degree: e.target.value }) }),
            ' ',
            React.createElement("input", { placeholder: "Institution", value: form.institution, onChange: (e) => setForm({ ...form, institution: e.target.value }) }),
            ' ',
            React.createElement("input", { type: "date", value: form.startDate, onChange: (e) => setForm({ ...form, startDate: e.target.value }) }),
            ' ',
            React.createElement("input", { type: "date", value: form.endDate, onChange: (e) => setForm({ ...form, endDate: e.target.value }) }),
            ' ',
            React.createElement("input", { placeholder: "GPA", value: form.gpa, onChange: (e) => setForm({ ...form, gpa: e.target.value }) }),
            ' ',
            React.createElement("button", { onClick: () => {
                    axios.post(`${API}/education`, form).then(() => { axios.get(`${API}/education/user/1`).then((r) => setItems(r.data)); resetForm(); });
                } }, "Add")),
        React.createElement("ul", null, items.map((e) => (React.createElement("li", { key: e.id, style: { marginBottom: 8 } },
            React.createElement("strong", null, e.degree),
            " \u2014 ",
            e.institution,
            React.createElement("br", null),
            e.fieldOfStudy && React.createElement("em", null, e.fieldOfStudy),
            " ",
            e.startDate?.slice(0, 10),
            " - ",
            e.endDate ? e.endDate.slice(0, 10) : 'Ongoing',
            e.showGpa && e.gpa && React.createElement("div", null,
                "GPA: ",
                e.gpa),
            e.honors?.length > 0 && React.createElement("div", null,
                "Honors: ",
                e.honors.join(', ')),
            React.createElement("div", { style: { marginTop: 6 } },
                React.createElement("button", { onClick: () => {
                        if (!confirm('Delete this education entry?'))
                            return;
                        axios.delete(`${API}/education/${e.id}`).then(() => axios.get(`${API}/education/user/1`).then((r) => setItems(r.data)));
                    } }, "Delete"))))))));
}
//# sourceMappingURL=EducationPage.js.map