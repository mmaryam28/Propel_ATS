import React from 'react';
export default function ApplicationsPage() {
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "sm:flex sm:items-center sm:justify-between" },
            React.createElement("h1", { className: "text-2xl font-semibold text-gray-900" }, "Applications"),
            React.createElement("button", { type: "button", className: "mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" }, "Add Application")),
        React.createElement("div", { className: "bg-white shadow overflow-hidden sm:rounded-md" },
            React.createElement("ul", { className: "divide-y divide-gray-200" },
                React.createElement("li", { className: "p-4" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm font-medium text-gray-900" }, "Software Engineer"),
                            React.createElement("p", { className: "text-sm text-gray-500" }, "Example Company Inc.")),
                        React.createElement("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800" }, "In Progress"))))),
        React.createElement("div", { className: "text-center py-12" },
            React.createElement("svg", { className: "mx-auto h-12 w-12 text-gray-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })),
            React.createElement("h3", { className: "mt-2 text-sm font-medium text-gray-900" }, "No applications"),
            React.createElement("p", { className: "mt-1 text-sm text-gray-500" }, "Get started by adding your first job application."),
            React.createElement("div", { className: "mt-6" },
                React.createElement("button", { type: "button", className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" }, "Add Application")))));
}
//# sourceMappingURL=ApplicationsPage.js.map