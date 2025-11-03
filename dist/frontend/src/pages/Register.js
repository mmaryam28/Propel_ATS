import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthCard from "../components/AuthCard";
export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await axios.post("/auth/register", {
                firstname: form.firstName,
                lastname: form.lastName,
                email: form.email,
                password: form.password,
            });
            navigate("/dashboard");
        }
        catch {
            setError("Email already in use");
        }
    };
    return (React.createElement("div", { className: "auth-page" },
        React.createElement("header", { className: "lp-header container" },
            React.createElement("div", { className: "lp-brand" },
                React.createElement("img", { src: "/propel-logo.png", alt: "Propel Logo", className: "lp-logo" }),
                React.createElement("span", { className: "lp-wordmark" }, "Propel")),
            React.createElement("nav", { className: "lp-nav" },
                React.createElement(Link, { to: "/login", className: "lp-link" }, "Login"),
                React.createElement(Link, { to: "/register", className: "btn btn--primary" }, "Get Started"))),
        React.createElement(AuthCard, { title: "Create your account" },
            React.createElement("form", { onSubmit: submit },
                React.createElement("input", { placeholder: "First Name", value: form.firstName, onChange: (e) => setForm({ ...form, firstName: e.target.value }), required: true }),
                React.createElement("input", { placeholder: "Last Name", value: form.lastName, onChange: (e) => setForm({ ...form, lastName: e.target.value }), required: true }),
                React.createElement("input", { type: "email", placeholder: "Email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true }),
                React.createElement("input", { type: "password", placeholder: "Password", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true }),
                error && React.createElement("p", { className: "error" }, error),
                React.createElement("button", { type: "submit" }, "Register"),
                React.createElement("p", null,
                    React.createElement(Link, { to: "/login" }, "Already have an account? Login \u2192"))))));
}
//# sourceMappingURL=Register.js.map