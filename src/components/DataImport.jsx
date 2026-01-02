import { useState } from 'react';
import { generateDataset } from '../lib/generator';
import './DataImport.css';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, i) => {
      let val = values[i] || '';
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      obj[header] = val;
    });
    return obj;
  });
}

const CSV_TEMPLATES = {
  companies: 'id,name,isPortfolio,founder_id,foundedAt,country,stage,sector,cashOnHand,monthlyBurn,mrr,employeeCount,lastMaterialUpdate_at',
  firms: 'id,name,firmType,typicalCheckMin,typicalCheckMax',
  people: 'id,firstName,lastName,email,role,firm_id,title,lastContactedAt',
  rounds: 'id,company_id,roundType,targetAmount,raisedAmount,status,startedAt,targetCloseDate,leadInvestor_id',
  goals: 'id,company_id,goalType,title,targetValue,currentValue,startDate,targetDate,lastUpdatedAt',
  deals: 'id,round_id,firm_id,person_id,dealStage,lastContactDate,introducedBy_id,expectedAmount',
};

export default function DataImport({ onDataLoaded }) {
  const [mode, setMode] = useState('generate');
  const [portfolioCount, setPortfolioCount] = useState(12);
  const [stressLevel, setStressLevel] = useState('default');
  const [tables, setTables] = useState({ companies: '', firms: '', people: '', rounds: '', goals: '', deals: '' });
  const [activeTab, setActiveTab] = useState('companies');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    const data = generateDataset(portfolioCount, stressLevel);
    onDataLoaded(data);
  };

  const handleLoadCSV = () => {
    setError('');
    if (!tables.companies.trim()) { setError('Companies CSV required'); return; }
    try {
      const data = {};
      for (const [key, csv] of Object.entries(tables)) {
        data[key] = csv.trim() ? parseCSV(csv) : [];
      }
      if (data.companies.length === 0) { setError('No companies parsed'); return; }
      onDataLoaded(data);
    } catch (e) { setError('Parse error: ' + e.message); }
  };

  const tabOrder = ['companies', 'firms', 'people', 'rounds', 'goals', 'deals'];

  return (
    <div className="import-container">
      <div className="import-box">
        <h1>BACKBONE</h1>
        <p className="import-subtitle">Generate synthetic data or import CSV</p>
        
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => setMode('generate')}
          >
            Generate Data
          </button>
          <button 
            className={`mode-btn ${mode === 'csv' ? 'active' : ''}`}
            onClick={() => setMode('csv')}
          >
            Import CSV
          </button>
        </div>

        {mode === 'generate' && (
          <div className="generate-controls">
            <div className="control-row">
              <label>Portfolio Companies</label>
              <input 
                type="number" 
                value={portfolioCount} 
                onChange={(e) => setPortfolioCount(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>
            <div className="control-row">
              <label>Stress Level</label>
              <select value={stressLevel} onChange={(e) => setStressLevel(e.target.value)}>
                <option value="default">Default</option>
                <option value="moderate">Moderate</option>
                <option value="high">High Stress</option>
              </select>
            </div>
            <button className="btn primary full-width" onClick={handleGenerate}>
              Generate & Launch
            </button>
          </div>
        )}

        {mode === 'csv' && (
          <>
            <div className="tab-nav">
              {tabOrder.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''} ${tables[tab].trim() ? 'has-data' : ''}`}
                >
                  {tab}
                  {tab === 'companies' && <span className="required">*</span>}
                  {tables[tab].trim() && <span className="check">✓</span>}
                </button>
              ))}
            </div>

            <div className="field-group">
              <div className="field-header">
                <label>{activeTab}</label>
                <span className="template-hint">{CSV_TEMPLATES[activeTab]}</span>
              </div>
              <textarea
                value={tables[activeTab]}
                onChange={(e) => setTables(prev => ({ ...prev, [activeTab]: e.target.value }))}
                placeholder={`Paste ${activeTab} CSV...\n\n${CSV_TEMPLATES[activeTab]}`}
                rows={10}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}
            
            <div className="import-actions">
              <div className="data-summary">
                {tabOrder.map(tab => tables[tab].trim() && (
                  <span key={tab} className="summary-item">
                    {tab}: {parseCSV(tables[tab]).length}
                  </span>
                ))}
              </div>
              <button className="btn primary" onClick={handleLoadCSV}>Launch Dashboard</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
