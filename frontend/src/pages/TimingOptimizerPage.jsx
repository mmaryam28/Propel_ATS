import React, { useState } from 'react';
import TimingRecommendation from '../components/TimingRecommendation';
import ApplicationScheduler from '../components/ApplicationScheduler';
import CalendarView from '../components/CalendarView';
import './TimingOptimizerPage.css';

export default function TimingOptimizerPage() {
  const [activeTab, setActiveTab] = useState('recommendation');
  const [applicationId] = useState(1); // Demo app ID
  const [industry, setIndustry] = useState('tech');
  const [companySize, setCompanySize] = useState('large');
  const [qualityScore, setQualityScore] = useState(68);

  return (
    <div className="timing-optimizer-page">
      <div className="timing-header">
        <h1>Application Timing Optimizer</h1>
        <p>Get personalized timing recommendations to maximize your application success rate</p>
      </div>

      <div className="timing-config">
        <h3>Application Details</h3>
        <div className="config-grid">
          <div className="config-field">
            <label>Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="tech">Tech</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="retail">Retail</option>
            </select>
          </div>
          <div className="config-field">
            <label>Company Size</label>
            <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
              <option value="startup">Startup (1-50)</option>
              <option value="small">Small (51-200)</option>
              <option value="medium">Medium (201-1000)</option>
              <option value="large">Large (1000+)</option>
            </select>
          </div>
          <div className="config-field">
            <label>Quality Score: {qualityScore}/100</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={qualityScore} 
              onChange={(e) => setQualityScore(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="timing-tabs">
        <button 
          className={`tab-button ${activeTab === 'recommendation' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendation')}
        >
          📊 Timing Recommendation
        </button>
        <button 
          className={`tab-button ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          📅 Scheduler
        </button>
        <button 
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📆 Calendar View
        </button>
      </div>

      <div className="timing-content">
        {activeTab === 'recommendation' && (
          <TimingRecommendation 
            applicationId={applicationId}
            industry={industry}
            companySize={companySize}
            applicationQualityScore={qualityScore}
          />
        )}
        {activeTab === 'scheduler' && (
          <ApplicationScheduler 
            applicationId={applicationId}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView />
        )}
      </div>
    </div>
  );
}
