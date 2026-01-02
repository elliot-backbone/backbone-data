import { detectIssues, calculateHealth } from '../lib/derivations';
import './PortfolioOverview.css';

export default function PortfolioOverview({ rawData }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const companies = (rawData.companies || []).map(c => ({
    ...c,
    healthScore: calculateHealth(c, issues)
  }));

  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  const portfolioHealth = portfolioCompanies.length > 0
    ? Math.round(portfolioCompanies.reduce((sum, c) => sum + c.healthScore, 0) / portfolioCompanies.length)
    : 0;

  const totalArr = portfolioCompanies.reduce((sum, c) => sum + c.arr, 0);
  const avgGrowthRate = portfolioCompanies.length > 0
    ? portfolioCompanies.reduce((sum, c) => sum + c.revenueGrowthRate, 0) / portfolioCompanies.length
    : 0;

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;

  const companiesWithLowRunway = portfolioCompanies.filter(c => c.runway < 6).length;
  const companiesHealthy = portfolioCompanies.filter(c => c.healthScore >= 80).length;
  const companiesAtRisk = portfolioCompanies.filter(c => c.healthScore < 60).length;

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const healthDistribution = [
    { range: '80-100', label: 'Healthy', count: portfolioCompanies.filter(c => c.healthScore >= 80).length, color: '#10b981' },
    { range: '60-79', label: 'Good', count: portfolioCompanies.filter(c => c.healthScore >= 60 && c.healthScore < 80).length, color: '#3b82f6' },
    { range: '40-59', label: 'Warning', count: portfolioCompanies.filter(c => c.healthScore >= 40 && c.healthScore < 60).length, color: '#f59e0b' },
    { range: '0-39', label: 'Critical', count: portfolioCompanies.filter(c => c.healthScore < 40).length, color: '#ef4444' }
  ];

  const topPerformers = [...portfolioCompanies]
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 5);

  const bottomPerformers = [...portfolioCompanies]
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  return (
    <div className="portfolio-overview">
      <div className="overview-hero">
        <div className="hero-stat">
          <div className="hero-stat-value" style={{ color: getHealthColor(portfolioHealth) }}>
            {portfolioHealth}
          </div>
          <div className="hero-stat-label">Portfolio Health Score</div>
        </div>
        <div className="hero-stats-grid">
          <div className="hero-mini-stat">
            <div className="mini-stat-value">{portfolioCompanies.length}</div>
            <div className="mini-stat-label">Companies</div>
          </div>
          <div className="hero-mini-stat">
            <div className="mini-stat-value">${(totalArr / 1000000).toFixed(1)}M</div>
            <div className="mini-stat-label">Total ARR</div>
          </div>
          <div className="hero-mini-stat">
            <div className="mini-stat-value">{(avgGrowthRate * 100).toFixed(0)}%</div>
            <div className="mini-stat-label">Avg Growth</div>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-section">
          <h2 className="overview-section-title">Key Alerts</h2>
          <div className="alerts-grid">
            <div className="alert-box critical">
              <div className="alert-icon">🚨</div>
              <div className="alert-content">
                <div className="alert-number">{criticalIssues}</div>
                <div className="alert-label">Critical Issues</div>
              </div>
            </div>
            <div className="alert-box warning">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <div className="alert-number">{highIssues}</div>
                <div className="alert-label">High Priority</div>
              </div>
            </div>
            <div className="alert-box info">
              <div className="alert-icon">⏱️</div>
              <div className="alert-content">
                <div className="alert-number">{companiesWithLowRunway}</div>
                <div className="alert-label">Low Runway</div>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-section">
          <h2 className="overview-section-title">Health Distribution</h2>
          <div className="health-distribution">
            {healthDistribution.map(bucket => (
              <div key={bucket.range} className="distribution-item">
                <div className="distribution-header">
                  <span className="distribution-label">{bucket.label}</span>
                  <span className="distribution-count">{bucket.count}</span>
                </div>
                <div className="distribution-bar-container">
                  <div
                    className="distribution-bar"
                    style={{
                      width: portfolioCompanies.length > 0
                        ? `${(bucket.count / portfolioCompanies.length) * 100}%`
                        : '0%',
                      background: bucket.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-section">
          <h2 className="overview-section-title">Top Performers</h2>
          <div className="performers-list">
            {topPerformers.map((company, idx) => (
              <div key={company.id} className="performer-item">
                <div className="performer-rank">#{idx + 1}</div>
                <div className="performer-info">
                  <div className="performer-name">{company.name}</div>
                  <div className="performer-sector">{company.sector}</div>
                </div>
                <div
                  className="performer-score"
                  style={{ color: getHealthColor(company.healthScore) }}
                >
                  {company.healthScore}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-section">
          <h2 className="overview-section-title">Needs Attention</h2>
          <div className="performers-list">
            {bottomPerformers.map((company, idx) => (
              <div key={company.id} className="performer-item attention">
                <div className="performer-rank attention-rank">#{idx + 1}</div>
                <div className="performer-info">
                  <div className="performer-name">{company.name}</div>
                  <div className="performer-sector">{company.sector}</div>
                </div>
                <div
                  className="performer-score"
                  style={{ color: getHealthColor(company.healthScore) }}
                >
                  {company.healthScore}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-section full-width">
          <h2 className="overview-section-title">Portfolio Metrics Summary</h2>
          <div className="metrics-summary-grid">
            <div className="summary-metric">
              <div className="summary-metric-label">Companies Healthy</div>
              <div className="summary-metric-value" style={{ color: '#10b981' }}>
                {companiesHealthy}
              </div>
            </div>
            <div className="summary-metric">
              <div className="summary-metric-label">Companies at Risk</div>
              <div className="summary-metric-value" style={{ color: '#ef4444' }}>
                {companiesAtRisk}
              </div>
            </div>
            <div className="summary-metric">
              <div className="summary-metric-label">Total Portfolio ARR</div>
              <div className="summary-metric-value">${(totalArr / 1000000).toFixed(2)}M</div>
            </div>
            <div className="summary-metric">
              <div className="summary-metric-label">Average Growth Rate</div>
              <div className="summary-metric-value">{(avgGrowthRate * 100).toFixed(1)}%</div>
            </div>
            <div className="summary-metric">
              <div className="summary-metric-label">Total Issues</div>
              <div className="summary-metric-value">{issues.length}</div>
            </div>
            <div className="summary-metric">
              <div className="summary-metric-label">Low Runway Companies</div>
              <div className="summary-metric-value" style={{ color: '#f59e0b' }}>
                {companiesWithLowRunway}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
