import { useState } from 'react';
import './AdminAnalyze.css';

export default function AdminAnalyze() {
  const [activeSubview, setActiveSubview] = useState('enrich');

  return (
    <div className="admin-analyze">
      <div className="analyze-header">
        <h3>Data Analysis</h3>
      </div>

      <div className="analyze-tabs">
        <button
          className={`analyze-tab ${activeSubview === 'enrich' ? 'active' : ''}`}
          onClick={() => setActiveSubview('enrich')}
        >
          Enrich
        </button>
        <button
          className={`analyze-tab ${activeSubview === 'calculate' ? 'active' : ''}`}
          onClick={() => setActiveSubview('calculate')}
        >
          Calculate
        </button>
      </div>

      <div className="analyze-content">
        {activeSubview === 'enrich' && <EnrichView />}
        {activeSubview === 'calculate' && <CalculateView />}
      </div>
    </div>
  );
}

function EnrichView() {
  return (
    <div className="analyze-subview">
      <div className="placeholder-content">
        <div className="placeholder-icon">🔍</div>
        <h4>Data Enrichment</h4>
        <p>Enhance your data with external sources and intelligence</p>
        <ul className="feature-list">
          <li>Company information lookup</li>
          <li>LinkedIn profile enrichment</li>
          <li>Funding data integration</li>
          <li>Market intelligence</li>
          <li>Contact verification</li>
        </ul>
        <div className="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  );
}

function CalculateView() {
  return (
    <div className="analyze-subview">
      <div className="placeholder-content">
        <div className="placeholder-icon">📊</div>
        <h4>Advanced Calculations</h4>
        <p>Run sophisticated analytics and derivations on your portfolio data</p>
        <ul className="feature-list">
          <li>Health score computation</li>
          <li>Risk assessment models</li>
          <li>Trajectory predictions</li>
          <li>Priority calculations</li>
          <li>Portfolio-level aggregations</li>
        </ul>
        <div className="coming-soon-badge">Coming Soon</div>
      </div>
    </div>
  );
}
