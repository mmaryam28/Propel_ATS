import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthCard from "../components/AuthCard";
import React from "react";
export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await axios.post("/auth/login", form);
            navigate("/dashboard");
        }
        catch {
            setError("Invalid email or password");
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
        React.createElement(AuthCard, { title: "Welcome Back" },
            React.createElement("form", { onSubmit: submit },
                React.createElement("input", { type: "email", placeholder: "Email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true }),
                React.createElement("input", { type: "password", placeholder: "Password", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }), required: true }),
                error && React.createElement("p", { className: "error" }, error),
                React.createElement("button", { type: "submit" }, "Sign In"),
                React.createElement("p", null,
                    React.createElement(Link, { to: "/register" }, "Create an account \u2192"))))));
}
//# sourceMappingURL=Login.js.map