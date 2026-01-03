import { useState } from 'react';
import { clearAllData, importGeneratedData } from '../lib/dataImporter';
import './AdminGenerate.css';

export default function AdminGenerate() {
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
      setLoading(false);
    } catch (err) {
      setError('Data generation failed: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="admin-generate">
      <div className="generate-header">
        <h3>Generate Sample Data</h3>
        <p>Create realistic portfolio data with configurable parameters</p>
      </div>

      <div className="generate-content">
        <div className="generate-controls">
          <div className="control-group">
            <label>Portfolio Companies</label>
            <input
              type="number"
              className="number-input"
              min="1"
              max="50"
              value={portfolioCount}
              onChange={(e) => setPortfolioCount(parseInt(e.target.value) || 12)}
              disabled={loading}
            />
          </div>

          <div className="control-group">
            <label>Stress Level</label>
            <select
              className="select-input"
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              disabled={loading}
            >
              <option value="default">Default (Balanced)</option>
              <option value="moderate">Moderate (Some Issues)</option>
              <option value="high">High (Critical Portfolio)</option>
            </select>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Data'}
          </button>
        </div>

        {status && !error && (
          <div className="status-msg success">
            {status}
          </div>
        )}

        {error && (
          <div className="status-msg error">
            {error}
          </div>
        )}

        <div className="generate-info">
          <p>This will clear all existing data and generate sample companies, investors, deals, and goals.</p>
        </div>
      </div>
    </div>
  );
}
