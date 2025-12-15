import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Focus, BarChart3, Eye, Keyboard } from 'lucide-react';

/**
 * UC-144: Accessibility Compliance Testing Demo
 * Demonstrates WCAG 2.1 AA compliance, keyboard navigation, and ARIA attributes
 */
const AccessibilityDemo = () => {
  const [auditResults, setAuditResults] = useState(null);
  const [keyboardFocusIndex, setKeyboardFocusIndex] = useState(-1);
  const [selectedTest, setSelectedTest] = useState('overview');
  const focusableElements = useRef([]);

  // Accessibility audit results - simulating axe DevTools output
  const accessibilityAuditData = {
    testDate: new Date().toLocaleDateString(),
    wcagVersion: '2.1',
    conformanceLevel: 'AA',
    summary: {
      criticalIssues: 0,
      seriousIssues: 0,
      moderateIssues: 2,
      minorIssues: 1,
      compliant: true,
    },
    results: {
      passed: [
        {
          id: 'color-contrast',
          title: 'Color contrast ratios meet WCAG AA standards',
          impact: 'critical',
          status: 'pass',
          elements: 'All text elements tested',
          wcagCriteria: ['1.4.3 Contrast (Minimum)'],
        },
        {
          id: 'form-labels',
          title: 'Form labels properly associated with inputs',
          impact: 'critical',
          status: 'pass',
          elements: 'All form controls have accessible names',
          wcagCriteria: ['1.3.1 Info and Relationships', '4.1.2 Name, Role, Value'],
        },
        {
          id: 'focus-visible',
          title: 'Focus indicators are visible',
          impact: 'critical',
          status: 'pass',
          elements: 'All interactive elements have visible focus',
          wcagCriteria: ['2.4.7 Focus Visible'],
        },
        {
          id: 'keyboard-nav',
          title: 'All functionality available via keyboard',
          impact: 'critical',
          status: 'pass',
          elements: 'All features accessible without mouse',
          wcagCriteria: ['2.1.1 Keyboard', '2.1.2 No Keyboard Trap'],
        },
        {
          id: 'alt-text',
          title: 'All images have descriptive alt text',
          impact: 'critical',
          status: 'pass',
          elements: 'Images properly labeled for screen readers',
          wcagCriteria: ['1.1.1 Non-text Content'],
        },
        {
          id: 'landmarks',
          title: 'Page structure with semantic landmarks',
          impact: 'serious',
          status: 'pass',
          elements: 'Main, navigation, and contentinfo landmarks identified',
          wcagCriteria: ['1.3.1 Info and Relationships'],
        },
        {
          id: 'aria-labels',
          title: 'ARIA attributes properly implemented',
          impact: 'critical',
          status: 'pass',
          elements: 'All custom components have ARIA labels',
          wcagCriteria: ['4.1.2 Name, Role, Value'],
        },
        {
          id: 'heading-hierarchy',
          title: 'Heading hierarchy is logical',
          impact: 'serious',
          status: 'pass',
          elements: 'H1-H6 sequence maintains proper structure',
          wcagCriteria: ['1.3.1 Info and Relationships'],
        },
      ],
      warnings: [
        {
          id: 'link-text',
          title: 'Link text should be descriptive',
          impact: 'moderate',
          status: 'warning',
          count: 2,
          description: 'Some links use generic text like "click here"',
          suggestion: 'Use descriptive link text that explains the destination',
        },
        {
          id: 'button-spacing',
          title: 'Interactive elements have adequate spacing',
          impact: 'moderate',
          status: 'warning',
          count: 1,
          description: 'One button may be difficult for touch users to click',
          suggestion: 'Ensure minimum 44x44px touch target size',
        },
      ],
      inaccessible: [
        {
          id: 'video-captions',
          title: 'Video content has captions',
          impact: 'serious',
          status: 'not-applicable',
          reason: 'No video content detected on this page',
        },
      ],
    },
    tools: ['axe DevTools', 'Lighthouse', 'WAVE', 'NVDA Screen Reader'],
  };

  useEffect(() => {
    // Simulate loading audit data
    setTimeout(() => {
      setAuditResults(accessibilityAuditData);
    }, 500);

    // Collect all focusable elements for keyboard navigation testing
    const collectFocusableElements = () => {
      focusableElements.current = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    collectFocusableElements();
    window.addEventListener('load', collectFocusableElements);
    return () => window.removeEventListener('load', collectFocusableElements);
  }, []);

  const handleKeyboardNavigation = (event) => {
    if (event.key === 'Tab') {
      const isShift = event.shiftKey;
      const currentIndex = keyboardFocusIndex;
      let nextIndex = isShift ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex >= focusableElements.current.length) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = focusableElements.current.length - 1;
      }

      setKeyboardFocusIndex(nextIndex);
    }
  };

  if (!auditResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center">
            <div className="animate-pulse text-gray-600">Loading accessibility audit results...</div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, results } = auditResults;
  const compliancePercentage = Math.round(
    ((results.passed.length) / (results.passed.length + results.warnings.length)) * 100
  );

  return (
    <div 
      className="min-h-screen bg-gray-50 p-6"
      onKeyDown={handleKeyboardNavigation}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Accessibility Compliance Testing
            </h1>
          </div>
          <p className="text-gray-600">
            UC-144: WCAG 2.1 AA Compliance Verification
          </p>
        </div>

        {/* Compliance Summary Card */}
        <div className={`bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 ${summary.compliant ? 'border-green-500' : 'border-red-500'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compliance Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {summary.compliant ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  Compliance Status
                </h2>
              </div>
              <p className={`text-2xl font-bold ${summary.compliant ? 'text-green-600' : 'text-red-600'}`}>
                {summary.compliant ? 'WCAG 2.1 AA' : 'Non-compliant'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Conforms to Level AA standards
              </p>
            </div>

            {/* Critical Issues */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Critical Issues
                </h3>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {summary.criticalIssues}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Blocking accessibility
              </p>
            </div>

            {/* Compliance Score */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Compliance Score
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {compliancePercentage}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tests passed
              </p>
            </div>
          </div>
        </div>

        {/* Test Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setSelectedTest('overview')}
            className={`p-3 rounded-lg font-semibold transition ${
              selectedTest === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={selectedTest === 'overview'}
            aria-label="View accessibility audit overview"
          >
            Audit Results
          </button>
          <button
            onClick={() => setSelectedTest('keyboard')}
            className={`p-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              selectedTest === 'keyboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={selectedTest === 'keyboard'}
            aria-label="Test keyboard navigation"
          >
            <Keyboard className="w-4 h-4" />
            Keyboard Nav
          </button>
          <button
            onClick={() => setSelectedTest('forms')}
            className={`p-3 rounded-lg font-semibold transition ${
              selectedTest === 'forms'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={selectedTest === 'forms'}
            aria-label="Test form accessibility and ARIA labels"
          >
            Forms & ARIA
          </button>
        </div>

        {/* Audit Results Section */}
        {selectedTest === 'overview' && (
          <div className="space-y-6">
            {/* Passed Tests */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Passed Tests ({results.passed.length})
                  </h3>
                </div>
              </div>
              <div className="divide-y">
                {results.passed.map((test) => (
                  <div key={test.id} className="p-4 hover:bg-green-50 transition">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{test.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{test.elements}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {test.wcagCriteria.map((criteria, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {criteria}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Warnings ({results.warnings.length})
                    </h3>
                  </div>
                </div>
                <div className="divide-y">
                  {results.warnings.map((warning) => (
                    <div key={warning.id} className="p-4 hover:bg-yellow-50 transition">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{warning.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{warning.description}</p>
                          <p className="text-sm text-yellow-700 mt-2">
                            <strong>Suggestion:</strong> {warning.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Navigation Testing */}
        {selectedTest === 'keyboard' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Keyboard className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Keyboard Navigation Test
              </h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
              <p className="text-sm text-blue-900 mb-3">
                <strong>Instructions:</strong> Press Tab to navigate between focusable elements.
                All form fields, buttons, and links should be accessible via keyboard.
              </p>
              <p className="text-xs text-blue-800">
                <strong>Keyboard shortcuts:</strong> Tab (next) | Shift+Tab (previous) | Enter (activate) | Space (toggle)
              </p>
            </div>

            <div className="space-y-4">
              {/* Test Form 1 */}
              <fieldset className="border border-gray-300 p-4 rounded">
                <legend className="px-2 font-semibold text-gray-900">
                  Accessibility Features Form
                </legend>
                
                <div className="space-y-3 mt-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-600" aria-label="required">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-required="true"
                      aria-describedby="name-help"
                    />
                    <p id="name-help" className="text-xs text-gray-600 mt-1">
                      This field is required for form submission
                    </p>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-600" aria-label="required">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-required="true"
                    />
                  </div>

                  <div>
                    <fieldset className="border-l-2 border-gray-300 pl-4 py-2">
                      <legend className="text-sm font-medium text-gray-700 mb-2">
                        Accessibility Needs
                      </legend>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                            aria-label="Screen reader support"
                          />
                          <span className="text-sm text-gray-700">Screen reader support</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                            aria-label="High contrast mode"
                          />
                          <span className="text-sm text-gray-700">High contrast mode</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                            aria-label="Keyboard navigation only"
                          />
                          <span className="text-sm text-gray-700">Keyboard navigation only</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      placeholder="Share your feedback..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      aria-label="Message textarea for feedback"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                      aria-label="Submit the accessibility form"
                    >
                      Submit
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                      aria-label="Clear the form"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </fieldset>

              {/* Navigation Links */}
              <div className="border border-gray-300 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Navigation Links (all keyboard accessible)
                </h4>
                <nav className="space-y-2">
                  <a
                    href="#overview"
                    className="block px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    aria-label="Go to overview section"
                  >
                    → Overview
                  </a>
                  <a
                    href="#compliance"
                    className="block px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    aria-label="Go to compliance section"
                  >
                    → Compliance Details
                  </a>
                  <a
                    href="#resources"
                    className="block px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    aria-label="Go to resources section"
                  >
                    → Resources
                  </a>
                </nav>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">✓ Full Keyboard Navigation Supported</p>
                  <p className="text-sm text-green-800 mt-1">
                    All interactive elements are reachable and usable via keyboard. No keyboard traps detected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms & ARIA Labels */}
        {selectedTest === 'forms' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Focus className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Forms & ARIA Labels
              </h3>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded mb-6">
              <p className="text-sm text-purple-900">
                <strong>ARIA Attributes Verification:</strong> All form labels, descriptions,
                and error messages are properly associated with form controls for screen reader users.
              </p>
            </div>

            <div className="space-y-6">
              {/* ARIA Example 1 */}
              <div className="border border-gray-300 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3">Example 1: Labeled Input</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto mb-3">
{`<label htmlFor="username">Username</label>
<input
  id="username"
  type="text"
  aria-required="true"
  aria-describedby="username-help"
/>
<p id="username-help">3-16 characters, letters and numbers only</p>`}
                </pre>
                <div className="space-y-3">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="3-16 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-required="true"
                    aria-describedby="username-help"
                  />
                  <p id="username-help" className="text-xs text-gray-600">
                    3-16 characters, letters and numbers only
                  </p>
                </div>
              </div>

              {/* ARIA Example 2 */}
              <div className="border border-gray-300 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3">Example 2: Fieldset & Legend</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto mb-3">
{`<fieldset>
  <legend>Preferred Contact Method</legend>
  <label>
    <input type="radio" name="contact" aria-label="Contact via email" />
    Email
  </label>
  <label>
    <input type="radio" name="contact" aria-label="Contact via phone" />
    Phone
  </label>
</fieldset>`}
                </pre>
                <fieldset className="border-l-2 border-gray-300 pl-4">
                  <legend className="text-sm font-medium text-gray-700 mb-3">
                    Preferred Contact Method
                  </legend>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contact"
                        className="w-4 h-4 focus:ring-2 focus:ring-purple-500"
                        aria-label="Contact via email"
                      />
                      <span className="text-sm text-gray-700">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contact"
                        className="w-4 h-4 focus:ring-2 focus:ring-purple-500"
                        aria-label="Contact via phone"
                      />
                      <span className="text-sm text-gray-700">Phone</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contact"
                        className="w-4 h-4 focus:ring-2 focus:ring-purple-500"
                        aria-label="Contact via SMS"
                      />
                      <span className="text-sm text-gray-700">SMS</span>
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* ARIA Example 3 */}
              <div className="border border-gray-300 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3">Example 3: Custom Buttons</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto mb-3">
{`<button
  onClick={handleDelete}
  aria-label="Delete item"
  aria-pressed="false"
  className="..."
>
  🗑️
</button>`}
                </pre>
                <div className="flex gap-2">
                  <button
                    className="w-10 h-10 bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Delete item"
                    aria-pressed="false"
                  >
                    🗑️
                  </button>
                  <button
                    className="w-10 h-10 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Edit item"
                    aria-pressed="false"
                  >
                    ✏️
                  </button>
                  <button
                    className="w-10 h-10 bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Save changes"
                    aria-pressed="false"
                  >
                    💾
                  </button>
                </div>
              </div>

              {/* ARIA Example 4 */}
              <div className="border border-gray-300 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3">Example 4: Alerts & Live Regions</h4>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto mb-3">
{`<div role="alert" aria-live="polite">
  Success: Changes saved
</div>`}
                </pre>
                <div
                  className="p-3 bg-green-100 border border-green-400 text-green-800 rounded"
                  role="alert"
                  aria-live="polite"
                >
                  ✓ Success: Form changes saved automatically
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">✓ All Forms Properly Labeled with ARIA Attributes</p>
                  <p className="text-sm text-green-800 mt-1">
                    All form controls have proper labels, descriptions, and ARIA attributes for screen reader compatibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tools */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Testing Tools Used
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {auditResults.tools.map((tool, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 border border-gray-200 rounded text-center hover:bg-gray-100 transition"
              >
                <p className="text-sm font-medium text-gray-900">{tool}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Accessibility audit completed on {auditResults.testDate}</p>
          <p className="mt-1">
            For more information, visit{' '}
            <a
              href="https://www.w3.org/WAI/WCAG21/quickref/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Learn more about WCAG 2.1 standards (opens in new window)"
            >
              WCAG 2.1 Guidelines
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityDemo;
