import React from "react";
import "./AuthCard.css";
export default function AuthCard({ children, title }) {
    return (React.createElement("div", { className: "auth-card-container" },
        React.createElement("div", { className: "auth-card" },
            React.createElement("img", { src: "/propel-logo.png", alt: "Propel Logo", className: "logo" }),
            React.createElement("h2", null, title),
            children)));
}
//# sourceMappingURL=AuthCard.js.map