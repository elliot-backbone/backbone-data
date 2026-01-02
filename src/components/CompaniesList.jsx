import { detectIssues, calculateHealth } from '../lib/derivations';
import './CompaniesList.css';

export default function CompaniesList({ rawData, onSelectCompany }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const allCompanies = (rawData.companies || []).map(c => ({
    ...c,
    healthScore: calculateHealth(c, issues)
  }));
  const companies = allCompanies.filter(c => c.isPortfolio);

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (company) => {
    if (company.isPortfolio) {
      return <span className="status-badge portfolio">Portfolio</span>;
    }
    return <span className="status-badge prospect">Prospect</span>;
  };

  return (
    <div className="companies-list">
      <div className="list-header">
        <div className="list-stats">
          <div className="stat-item">
            <span className="stat-value">{companies.length}</span>
            <span className="stat-label">Portfolio Companies</span>
          </div>
        </div>
      </div>

      <div className="companies-grid">
        {companies.map(company => (
          <div
            key={company.id}
            className="company-card"
            onClick={() => onSelectCompany(company)}
          >
            <div className="company-card-header">
              <div className="company-info">
                <h3 className="company-name">{company.name}</h3>
                <div className="company-meta">
                  <span className="company-sector">{company.sector}</span>
                  {getStatusBadge(company)}
                </div>
              </div>
              <div className="health-indicator">
                <div
                  className="health-circle"
                  style={{ borderColor: getHealthColor(company.healthScore) }}
                >
                  <span style={{ color: getHealthColor(company.healthScore) }}>
                    {company.healthScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="company-metrics">
              <div className="metric">
                <div className="metric-label">ARR</div>
                <div className="metric-value">${(company.arr / 1000000).toFixed(1)}M</div>
              </div>
              <div className="metric">
                <div className="metric-label">Burn</div>
                <div className="metric-value">${(company.monthlyBurn / 1000).toFixed(0)}K/mo</div>
              </div>
              <div className="metric">
                <div className="metric-label">Runway</div>
                <div className="metric-value">{company.runway} mo</div>
              </div>
              <div className="metric">
                <div className="metric-label">Growth</div>
                <div className="metric-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
