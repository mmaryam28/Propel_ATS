import React from 'react';
import { Card } from './ui/Card';

/**
 * UC-112: Salary Benchmarks Component
 * Displays salary range percentiles (25th, 50th, 75th) with market comparison
 */
export const SalaryBenchmarks = ({ jobTitle, location, benchmark, jobSalary }) => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(benchmark || null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (benchmark) {
      setData(benchmark);
      return;
    }

    if (!jobTitle || !location) return;

    const fetchBenchmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          (import.meta.env.VITE_API_URL || 'https://cs490-backend.onrender.com') + `/salary/benchmarks?jobTitle=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`
        );
        if (!response.ok) throw new Error('Failed to fetch salary data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, [jobTitle, location, benchmark]);

  if (loading) {
    return (
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>Salary Benchmarks</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-600">Loading salary data...</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="default" size="large">
        <Card.Header>
          <Card.Title>Salary Benchmarks</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-sm text-red-600">Unable to load salary data</div>
        </Card.Body>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate salary comparison if job has salary data
  const jobSalaryMid = jobSalary?.min && jobSalary?.max ? (jobSalary.min + jobSalary.max) / 2 : null;
  const benchmarkMedian = data.p50Percentile;

  let salaryComparison = null;
  let comparisonColor = 'text-gray-600';
  if (jobSalaryMid && benchmarkMedian) {
    const diff = jobSalaryMid - benchmarkMedian;
    const pctDiff = ((diff / benchmarkMedian) * 100).toFixed(1);
    salaryComparison = {
      diff,
      pctDiff,
      status: diff > 0 ? 'above' : diff < 0 ? 'below' : 'at',
    };
    if (diff > 0) comparisonColor = 'text-green-600';
    else if (diff < 0) comparisonColor = 'text-orange-600';
  }

  // Format currency
  const formatSalary = (amount) => {
    if (!amount) return 'N/A';
    return `$${Math.round(amount).toLocaleString()}`;
  };

  return (
    <Card variant="default" size="large">
      <Card.Header>
        <Card.Title>Salary Benchmarks for {data.jobTitle}</Card.Title>
        {data.location && (
          <p className="text-xs text-gray-500 mt-1">📍 {data.location}</p>
        )}
      </Card.Header>
      <Card.Body>
        <div className="space-y-6">
          {/* Percentile Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Market Salary Range</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* 25th Percentile */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">25th Percentile</div>
                <div className="text-xl font-bold text-gray-900 mt-2">
                  {formatSalary(data.p25Percentile)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Entry level / Junior</div>
              </div>

              {/* 50th Percentile (Median) */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 relative">
                <div className="absolute top-2 right-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                  Median
                </div>
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">50th Percentile</div>
                <div className="text-xl font-bold text-gray-900 mt-2">
                  {formatSalary(data.p50Percentile)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Mid-career / Experienced</div>
              </div>

              {/* 75th Percentile */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">75th Percentile</div>
                <div className="text-xl font-bold text-gray-900 mt-2">
                  {formatSalary(data.p75Percentile)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Senior / Leadership</div>
              </div>
            </div>
          </div>

          {/* Job Salary Comparison */}
          {jobSalary && jobSalary.min && jobSalary.max && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Job Posting vs Market</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Posting Range</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {formatSalary(jobSalary.min)} - {formatSalary(jobSalary.max)}
                    </div>
                    {jobSalaryMid && (
                      <div className="text-xs text-gray-500 mt-1">
                        Midpoint: {formatSalary(jobSalaryMid)}
                      </div>
                    )}
                  </div>
                  {salaryComparison && (
                    <div className={`text-right ${comparisonColor}`}>
                      <div className="text-xs font-medium uppercase tracking-wide">
                        {salaryComparison.status === 'above' ? '↑ Above Market' : salaryComparison.status === 'below' ? '↓ Below Market' : '= Market Rate'}
                      </div>
                      <div className="text-lg font-bold mt-1">
                        {salaryComparison.pctDiff > 0 ? '+' : ''}{salaryComparison.pctDiff}%
                      </div>
                      <div className="text-xs mt-1">
                        {salaryComparison.status === 'above' ? 'vs median' : 'vs median'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Source & Disclaimer */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex gap-2">
              <div className="text-xs text-yellow-800 flex-1">
                <strong>⚠️ Disclaimer:</strong> {data.disclaimer || 'Salary data is estimated based on public sources and may not reflect your specific situation.'}
              </div>
            </div>
          </div>

          {/* Data Source Link */}
          {data.sourceUrl && (
            <div className="text-xs text-gray-500">
              Data source: <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {data.dataSource}
              </a>
            </div>
          )}

          {/* Last Updated */}
          {data.lastUpdatedAt && (
            <div className="text-xs text-gray-400">
              Last updated: {new Date(data.lastUpdatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default SalaryBenchmarks;
