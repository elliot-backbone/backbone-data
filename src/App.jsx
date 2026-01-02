import { useState } from 'react';
import LandingPage from './components/LandingPage';
import DataImport from './components/DataImport';
import PriorityQueue from './components/PriorityQueue';
import PortfolioHealthBar from './components/PortfolioHealthBar';
import { detectIssues, calculateHealth } from './lib/derivations';
import './App.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [rawData, setRawData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!rawData) {
    return <DataImport onDataLoaded={setRawData} />;
  }

  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || []);
  const companies = (rawData.companies || []).map(c => ({ ...c, healthScore: calculateHealth(c, issues) }));
  const portfolioCompanies = companies.filter(c => c.isPortfolio);
  const portfolioHealth = portfolioCompanies.length > 0
    ? Math.round(portfolioCompanies.reduce((sum, c) => sum + c.healthScore, 0) / portfolioCompanies.length)
    : 0;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">BACKBONE</div>
        <button className="nav-btn reset-btn" onClick={() => setRawData(null)}>
          Reset Data
        </button>
      </header>

      <PortfolioHealthBar health={portfolioHealth} criticalCount={criticalCount} companyCount={portfolioCompanies.length} />

      <main className="main-content">
        <PriorityQueue issues={issues} companies={companies} onSelectItem={setSelectedItem} />
      </main>

      {selectedItem && (
        <aside className="detail-panel">
          <button className="close-btn" onClick={() => setSelectedItem(null)}>×</button>
          <h3>Why this priority?</h3>
          <div className="detail-section">
            <div className="detail-label">Trigger</div>
            <code>{selectedItem.triggerCondition}</code>
          </div>
          <div className="detail-section">
            <div className="detail-label">Type</div>
            <span>{selectedItem.type}</span>
          </div>
          <div className="detail-section">
            <div className="detail-label">Urgency Score</div>
            <span>{selectedItem.urgencyScore}</span>
          </div>
        </aside>
      )}
    </div>
  );
}
