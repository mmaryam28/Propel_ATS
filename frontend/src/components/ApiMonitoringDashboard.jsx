import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function ApiMonitoringDashboard() {
  const [usage, setUsage] = useState([]);
  const [errors, setErrors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [usageRes, errorsRes, alertsRes, respTimeRes] = await Promise.all([
          axios.get('/admin/api-monitoring/usage'),
          axios.get('/admin/api-monitoring/errors'),
          axios.get('/admin/api-monitoring/alerts'),
          axios.get('/admin/api-monitoring/response-times'),
        ]);
        setUsage(usageRes.data);
        setErrors(errorsRes.data);
        setAlerts(alertsRes.data);
        setResponseTimes(respTimeRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to load API monitoring data.');
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="api-monitoring-dashboard bg-white rounded-lg shadow p-6 mb-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">API Monitoring Dashboard</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">API Usage Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 font-medium text-gray-700">Service</th>
                <th className="py-2 px-3 font-medium text-gray-700">Usage</th>
                <th className="py-2 px-3 font-medium text-gray-700">Quota</th>
                <th className="py-2 px-3 font-medium text-gray-700">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {usage.map(u => (
                <tr key={u.service} className={u.remaining / u.quota < 0.1 ? 'bg-red-50' : ''}>
                  <td className="py-2 px-3">{u.service}</td>
                  <td className="py-2 px-3">{u.count}</td>
                  <td className="py-2 px-3">{u.quota}</td>
                  <td className={"py-2 px-3 font-bold " + (u.remaining / u.quota < 0.1 ? 'text-red-600' : 'text-gray-800')}>{u.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">API Rate Limit Alerts</h3>
        {alerts.length === 0 ? <p className="text-green-600">No alerts.</p> : (
          <ul className="list-disc pl-6">
            {alerts.map(a => (
              <li key={a.service} className="text-orange-600 font-semibold">
                {a.service}: Only {a.remaining} of {a.quota} requests remaining!
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">API Error Logs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 font-medium text-gray-700">Service</th>
                <th className="py-2 px-3 font-medium text-gray-700">Timestamp</th>
                <th className="py-2 px-3 font-medium text-gray-700">Error</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e, i) => (
                <tr key={i}>
                  <td className="py-2 px-3">{e.service}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-3 text-red-700 max-w-xs truncate" title={e.error}>{e.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">API Response Times</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 font-medium text-gray-700">Service</th>
                <th className="py-2 px-3 font-medium text-gray-700">Average Response Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {responseTimes.map(r => (
                <tr key={r.service}>
                  <td className="py-2 px-3">{r.service}</td>
                  <td className="py-2 px-3">{r.avgResponseTime.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Weekly API Usage Report</h3>
        <p className="text-gray-500">Report generation coming soon.</p>
      </section>
    </div>
  );
}
