import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertTriangle, Lock, Code } from 'lucide-react';
import axios from 'axios';

/**
 * UC-135: Production Security Hardening Demo
 * Demonstrates security protections: CSRF, XSS, SQL injection prevention, security headers
 */
const SecurityDemo = () => {
  const [csrfToken, setCsrfToken] = useState('');
  const [securityHeaders, setSecurityHeaders] = useState(null);
  const [xssTest, setXssTest] = useState('');
  const [xssResult, setXssResult] = useState(null);
  const [sqlTest, setSqlTest] = useState('');
  const [sqlResult, setSqlResult] = useState(null);
  const [csrfTestResult, setCsrfTestResult] = useState(null);
  const [auditData, setAuditData] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com';

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      // Load CSRF token
      const csrfRes = await axios.get(`${API_BASE}/security/csrf-token`, {
        withCredentials: true,
      });
      setCsrfToken(csrfRes.data.csrfToken);

      // Load security headers
      const headersRes = await axios.get(`${API_BASE}/security/headers`);
      setSecurityHeaders(headersRes.data.headers);

      // Load security audit
      const auditRes = await axios.get(`${API_BASE}/security/audit`);
      setAuditData(auditRes.data);
    } catch (error) {
      console.error('Error loading security info:', error);
    }
  };

  const testXSS = async () => {
    try {
      const response = await axios.post(`${API_BASE}/security/test-xss`, {
        input: xssTest,
      });
      setXssResult(response.data);
    } catch (error) {
      setXssResult({ error: error.message });
    }
  };

  const testSQLInjection = async () => {
    try {
      const response = await axios.post(`${API_BASE}/security/test-sql-injection`, {
        input: sqlTest,
      });
      setSqlResult(response.data);
    } catch (error) {
      setSqlResult({ error: error.message });
    }
  };

  const testCSRF = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/security/test-csrf`,
        { 
          data: 'Test CSRF protection'
        },
        {
          withCredentials: true,
          headers: {
            'csrf-token': 'demo-csrf-token-12345'
          }
        }
      );
      setCsrfTestResult({ 
        success: true, 
        message: response.data.message,
        statusCode: response.status 
      });
    } catch (error) {
      setCsrfTestResult({
        success: false,
        message: error.response?.data?.message || 'CSRF validation failed',
        statusCode: error.response?.status || 403,
      });
    }
  };

  const testCSRFWithoutToken = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/security/test-csrf`,
        { 
          data: 'Test CSRF protection without token'
        },
        {
          withCredentials: true,
        }
      );
      setCsrfTestResult({ 
        success: response.data.success, 
        message: response.data.message,
        statusCode: response.status 
      });
    } catch (error) {
      setCsrfTestResult({
        success: false,
        message: error.response?.data?.message || 'Request rejected: Missing CSRF token',
        statusCode: error.response?.status || 403,
        error: error.response?.data?.error || 'Forbidden',
      });
    }
  };

  const maliciousXSSExamples = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
  ];

  const maliciousSQLExamples = [
    "' OR '1'='1",
    "'; DROP TABLE users--",
    "' UNION SELECT * FROM users--",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Security</h1>
          </div>
          <p className="text-gray-600">
            Enterprise-grade security measures
          </p>
        </div>

        {/* Security Headers */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Security Headers
          </h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              View these headers in DevTools → Network → Response Headers
            </p>
            {securityHeaders ? (
              <div className="space-y-2 font-mono text-sm">
                {Object.entries(securityHeaders).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">{key}:</span>
                      <span className="text-gray-600 ml-2">{String(value).substring(0, 60)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">CSP (Content Security Policy)</p>
                <p className="text-sm text-gray-600">Prevents XSS by controlling resource loading</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">HSTS (Strict Transport Security)</p>
                <p className="text-sm text-gray-600">Forces HTTPS connections</p>
              </div>
            </div>
          </div>
        </div>

        {/* CSRF Protection Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            CSRF Protection
          </h2>
          <p className="text-gray-600 mb-4">
            CSRF tokens prevent unauthorized actions by verifying request origin
          </p>
          <div className="bg-purple-50 p-4 rounded border border-purple-200 mb-4">
            <p className="text-sm font-medium text-gray-700">Current CSRF Token:</p>
            <p className="font-mono text-xs text-gray-600 mt-2 break-all">
              {csrfToken || 'Loading...'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={testCSRFWithoutToken}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Test Without Token (Fail)
            </button>
            <button
              onClick={testCSRF}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Test With Token (Success)
            </button>
          </div>
          {csrfTestResult && (
            <div className={`mt-4 p-4 rounded ${csrfTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {csrfTestResult.success ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                  <p className="text-sm font-medium">{csrfTestResult.message}</p>
                </div>
                <span className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                  csrfTestResult.success
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {csrfTestResult.success ? '200 OK' : '403 FORBIDDEN'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Token Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  csrfTestResult.success
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {csrfTestResult.success ? '✓ Valid Token' : '✗ Invalid/Missing Token'}
                </span>
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-900 mb-1">🔍 Verify in DevTools:</p>
                <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Open DevTools → Network tab</li>
                  <li>Find the POST request to <code className="bg-blue-100 px-1 rounded">/security/test-csrf</code></li>
                  <li>Click on it → Go to <strong>Request Headers</strong> tab</li>
                  <li>Verify <code className="bg-blue-100 px-1 rounded">csrf-token: demo-csrf-token-12345</code> header exists</li>
                </ol>
              </div>
              {csrfTestResult.error && (
                <p className="text-xs text-red-700 mt-2">
                  Error: {csrfTestResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* XSS Protection Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-red-600" />
            XSS Protection
          </h2>
          <p className="text-gray-600 mb-4">
            All user inputs are sanitized using DOMPurify to prevent XSS attacks
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Try a malicious input:
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {maliciousXSSExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setXssTest(example)}
                  className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Example {idx + 1}
                </button>
              ))}
            </div>
            <textarea
              value={xssTest}
              onChange={(e) => setXssTest(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
              rows={3}
              placeholder="<script>alert('XSS')</script>"
            />
          </div>
          <button
            onClick={testXSS}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Test XSS Protection
          </button>
          {xssResult && (
            <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-start gap-2 mb-2">
                {xssResult.blocked ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="font-semibold text-yellow-800">{xssResult.message}</p>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-800">{xssResult.message}</p>
                  </>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Original:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                    {xssResult.original}
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sanitized:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                    {xssResult.sanitized}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SQL Injection Protection Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            SQL Injection Prevention
          </h2>
          <p className="text-gray-600 mb-4">
            All database queries use parameterized statements via Supabase RLS
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Try a malicious SQL input:
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {maliciousSQLExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setSqlTest(example)}
                  className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Example {idx + 1}
                </button>
              ))}
            </div>
            <textarea
              value={sqlTest}
              onChange={(e) => setSqlTest(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
              rows={3}
              placeholder="' OR '1'='1"
            />
          </div>
          <button
            onClick={testSQLInjection}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
          >
            Test SQL Injection Prevention
          </button>
          {sqlResult && (
            <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-start gap-2 mb-2">
                {sqlResult.sqlInjectionDetected ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="font-semibold text-yellow-800">{sqlResult.message}</p>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-800">{sqlResult.message}</p>
                  </>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Input:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                    {sqlResult.original}
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">SQL Injection Detected:</span>
                  <span className={`ml-2 font-semibold ${sqlResult.sqlInjectionDetected ? 'text-red-600' : 'text-green-600'}`}>
                    {sqlResult.sqlInjectionDetected ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Audit Summary */}
        {auditData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Security Audit Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(auditData.protections).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{value.description}</p>
                  {value.headers && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Headers:</p>
                      <p className="text-xs text-gray-600">{value.headers.join(', ')}</p>
                    </div>
                  )}
                  {value.features && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Features:</p>
                      <p className="text-xs text-gray-600">{value.features.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDemo;
