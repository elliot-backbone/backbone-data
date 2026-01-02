import { detectIssues, calculateHealth } from '../lib/derivations';
import './Snapshot.css';

function calculateImpact(issue, companies, rounds, goals) {
  const company = companies.find(c => c.id === issue.companyId);
  if (!company) return 0;

  let score = 0;

  const companyRounds = rounds.filter(r => r.company_id === company.id);
  const activeRound = companyRounds.find(r => r.status === 'active' || r.status === 'closing');

  const companyGoals = goals.filter(g => g.company_id === company.id);
  const blockedGoals = companyGoals.filter(g => {
    const progress = g.targetValue > 0 ? g.currentValue / g.targetValue : 0;
    return progress < 1;
  });

  if (issue.type === 'capital_sufficiency') {
    score += 90;
    if (activeRound) score += 40;
    score += blockedGoals.length * 20;
  }

  if (issue.type === 'revenue_viability') {
    score += 60;
    if (activeRound) score += 30;
    score += 25;
  }

  if (issue.type === 'attention_misallocation') {
    score += 40;
    score += 20;
  }

  return score;
}

export default function Snapshot({ rawData, resolvedPriorities = [], onSelectCompany }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], resolvedPriorities);
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

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  const issuesWithImpact = issues.map(issue => ({
    ...issue,
    impactScore: calculateImpact(issue, companies, rawData.rounds || [], rawData.goals || [])
  }));

  const topImpactIssues = [...issuesWithImpact]
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5);

  const companiesWithLowRunway = portfolioCompanies.filter(c => c.runway < 6).length;
  const companiesHealthy = portfolioCompanies.filter(c => c.healthScore >= 80).length;
  const companiesAtRisk = portfolioCompanies.filter(c => c.healthScore < 60).length;

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'high') return '#f59e0b';
    if (severity === 'medium') return '#3b82f6';
    return '#64748b';
  };

  const getCompanyName = (companyId) => companies.find(c => c.id === companyId)?.name || 'Unknown';
  const getCompany = (companyId) => companies.find(c => c.id === companyId);

  return (
    <div className="snapshot">
      <div className="snapshot-hero">
        <div className="hero-stat">
          <div className="hero-stat-value" style={{ color: getHealthColor(portfolioHealth) }}>
            {portfolioHealth}
          </div>
          <div className="hero-stat-label">Portfolio Health</div>
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

      <div className="snapshot-grid">
        <div className="snapshot-section">
          <h2 className="snapshot-section-title">Key Alerts</h2>
          <div className="alerts-grid">
            <div className="alert-box critical">
              <div className="alert-value">{criticalIssues.length}</div>
              <div className="alert-label">Critical Issues</div>
            </div>
            <div className="alert-box high">
              <div className="alert-value">{highIssues.length}</div>
              <div className="alert-label">High Priority</div>
            </div>
            <div className="alert-box warning">
              <div className="alert-value">{companiesWithLowRunway}</div>
              <div className="alert-label">Low Runway</div>
            </div>
          </div>
        </div>

        <div className="snapshot-section">
          <h2 className="snapshot-section-title">Company Health Distribution</h2>
          <div className="health-distribution-grid">
            <div className="health-dist-item">
              <div className="health-dist-value healthy">{companiesHealthy}</div>
              <div className="health-dist-label">Healthy (80+)</div>
            </div>
            <div className="health-dist-item">
              <div className="health-dist-value good">
                {portfolioCompanies.filter(c => c.healthScore >= 60 && c.healthScore < 80).length}
              </div>
              <div className="health-dist-label">Good (60-79)</div>
            </div>
            <div className="health-dist-item">
              <div className="health-dist-value warning">
                {portfolioCompanies.filter(c => c.healthScore >= 40 && c.healthScore < 60).length}
              </div>
              <div className="health-dist-label">Warning (40-59)</div>
            </div>
            <div className="health-dist-item">
              <div className="health-dist-value critical">{companiesAtRisk}</div>
              <div className="health-dist-label">Critical (&lt;40)</div>
            </div>
          </div>
        </div>

        <div className="snapshot-section full-width">
          <h2 className="snapshot-section-title">Highest Impact Issues</h2>
          <div className="impact-issues-list">
            {topImpactIssues.map((issue, idx) => {
              const company = getCompany(issue.companyId);
              return (
                <div
                  key={issue.id}
                  className="impact-issue-item"
                  onClick={() => company && onSelectCompany && onSelectCompany(company)}
                >
                  <div className="impact-rank">{idx + 1}</div>
                  <div className="impact-issue-content">
                    <div className="impact-issue-header">
                      <span
                        className="impact-severity-badge"
                        style={{
                          background: `${getSeverityColor(issue.severity)}15`,
                          color: getSeverityColor(issue.severity)
                        }}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="impact-company-name">{getCompanyName(issue.companyId)}</span>
                      <span className="impact-score">Impact: {issue.impactScore}</span>
                    </div>
                    <div className="impact-issue-title">{issue.title}</div>
                    <div className="impact-issue-action">{issue.suggestedAction}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="snapshot-section full-width">
          <h2 className="snapshot-section-title">Portfolio Companies</h2>
          <div className="companies-quick-grid">
            {portfolioCompanies.map(company => (
              <div
                key={company.id}
                className="company-quick-card"
                onClick={() => onSelectCompany && onSelectCompany(company)}
              >
                <div className="company-quick-header">
                  <h3 className="company-quick-name">{company.name}</h3>
                  <div
                    className="company-quick-health"
                    style={{ color: getHealthColor(company.healthScore) }}
                  >
                    {company.healthScore}
                  </div>
                </div>
                <div className="company-quick-metrics">
                  <div className="company-quick-metric">
                    <span className="metric-label">ARR:</span>
                    <span className="metric-value">${(company.arr / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="company-quick-metric">
                    <span className="metric-label">Runway:</span>
                    <span className="metric-value">{company.runway.toFixed(1)}mo</span>
                  </div>
                  <div className="company-quick-metric">
                    <span className="metric-label">Growth:</span>
                    <span className="metric-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
