import { useState } from 'react';
import { clearAllData, importGeneratedData } from '../lib/dataImporter';
import './LoadData.css';

export default function LoadData({ onComplete }) {
  const [portfolioCount, setPortfolioCount] = useState(12);
  const [stressLevel, setStressLevel] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      setStatus('Clearing existing data...');
      await clearAllData();

      setStatus('Generating portfolio data...');
      const counts = await importGeneratedData(portfolioCount, stressLevel);

      setStatus(`Generated ${counts.companies} companies, ${counts.rounds} rounds, ${counts.deals} deals`);

      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError('Data generation failed: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="load-data-container">
      <div className="load-data-card">
        <div className="load-data-header">
          <h1>Load Sample Data</h1>
          <p>Generate realistic portfolio data to explore Backbone</p>
        </div>

        <div className="load-data-controls">
          <div className="control-row">
            <label>Portfolio Companies</label>
            <input
              type="number"
              min="1"
              max="50"
              value={portfolioCount}
              onChange={(e) => setPortfolioCount(parseInt(e.target.value) || 12)}
              disabled={loading}
            />
          </div>

          <div className="control-row">
            <label>Stress Level</label>
            <select
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              disabled={loading}
            >
              <option value="default">Default (Balanced)</option>
              <option value="moderate">Moderate (Some Issues)</option>
              <option value="high">High (Critical Portfolio)</option>
            </select>
          </div>
        </div>

        {status && !error && (
          <div className="status-message">
            {status}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Sample Data'}
        </button>

        <div className="load-data-info">
          <p>This will create sample companies, investors, deals, and goals to demonstrate Backbone's capabilities.</p>
        </div>
      </div>
    </div>
  );
}
