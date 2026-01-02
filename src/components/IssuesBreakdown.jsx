import { detectIssues } from '../lib/derivations';
import './IssuesBreakdown.css';

const ISSUE_TYPE_CONFIG = {
  capital_sufficiency: {
    label: 'Capital Sufficiency',
    icon: '💰',
    color: '#ef4444',
    description: 'Runway, cash position, and fundraising urgency'
  },
  revenue_viability: {
    label: 'Revenue Viability',
    icon: '📈',
    color: '#f97316',
    description: 'Burn multiple, unit economics, path to profitability'
  },
  attention_misallocation: {
    label: 'Attention Misallocation',
    icon: '⏱️',
    color: '#eab308',
    description: 'Communication gaps, stale updates, relationship decay'
  },
  market_access: {
    label: 'Market Access',
    icon: '🎯',
    color: '#3b82f6',
    description: 'Investor access, lead generation, pipeline quality'
  },
  goal_risk: {
    label: 'Goal Risk',
    icon: '🎲',
    color: '#8b5cf6',
    description: 'Goal progress, deadline risk, stalled objectives'
  }
};

export default function IssuesBreakdown({ rawData, onSelectCompany }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const companies = rawData.companies || [];

  const issuesByType = Object.keys(ISSUE_TYPE_CONFIG).map(type => {
    const typeIssues = issues.filter(i => i.type === type);
    const criticalCount = typeIssues.filter(i => i.severity === 'critical').length;
    const highCount = typeIssues.filter(i => i.severity === 'high').length;
    const mediumCount = typeIssues.filter(i => i.severity === 'medium').length;
    const lowCount = typeIssues.filter(i => i.severity === 'low').length;

    const affectedCompanies = new Set(typeIssues.map(i => i.companyId));

    return {
      type,
      config: ISSUE_TYPE_CONFIG[type],
      issues: typeIssues,
      count: typeIssues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      affectedCompanyCount: affectedCompanies.size
    };
  });

  const sortedByType = [...issuesByType].sort((a, b) => {
    const severityScore = (t) => t.criticalCount * 100 + t.highCount * 10 + t.mediumCount;
    return severityScore(b) - severityScore(a);
  });

  const totalCritical = issues.filter(i => i.severity === 'critical').length;
  const totalHigh = issues.filter(i => i.severity === 'high').length;
  const totalMedium = issues.filter(i => i.severity === 'medium').length;

  const getCompanyName = (companyId) => companies.find(c => c.id === companyId)?.name || 'Unknown';
  const getCompany = (companyId) => companies.find(c => c.id === companyId);

  return (
    <div className="issues-breakdown">
      <div className="breakdown-header">
        <div className="header-stats">
          <div className="header-stat critical">
            <span className="header-stat-value">{totalCritical}</span>
            <span className="header-stat-label">Critical</span>
          </div>
          <div className="header-stat high">
            <span className="header-stat-value">{totalHigh}</span>
            <span className="header-stat-label">High</span>
          </div>
          <div className="header-stat medium">
            <span className="header-stat-value">{totalMedium}</span>
            <span className="header-stat-label">Medium</span>
          </div>
          <div className="header-stat total">
            <span className="header-stat-value">{issues.length}</span>
            <span className="header-stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="types-grid">
        {sortedByType.map(({ type, config, issues, count, criticalCount, highCount, mediumCount, lowCount, affectedCompanyCount }) => (
          <div key={type} className="type-card" style={{ borderLeftColor: config.color }}>
            <div className="type-header">
              <div className="type-info">
                <h3 className="type-name">{config.label}</h3>
                <p className="type-description">{config.description}</p>
              </div>
            </div>

            <div className="type-stats">
              <div className="type-stat-row">
                <span className="type-stat-label">Total Issues</span>
                <span className="type-stat-value">{count}</span>
              </div>
              <div className="type-stat-row">
                <span className="type-stat-label">Companies Affected</span>
                <span className="type-stat-value">{affectedCompanyCount}</span>
              </div>
            </div>

            <div className="severity-breakdown">
              {criticalCount > 0 && (
                <div className="severity-item critical">
                  <span className="severity-label">Critical</span>
                  <span className="severity-count">{criticalCount}</span>
                </div>
              )}
              {highCount > 0 && (
                <div className="severity-item high">
                  <span className="severity-label">High</span>
                  <span className="severity-count">{highCount}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="severity-item medium">
                  <span className="severity-label">Medium</span>
                  <span className="severity-count">{mediumCount}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="severity-item low">
                  <span className="severity-label">Low</span>
                  <span className="severity-count">{lowCount}</span>
                </div>
              )}
            </div>

            {issues.length > 0 && (
              <div className="type-issues">
                <div className="issues-header">Top Issues</div>
                {issues.slice(0, 3).map(issue => {
                  const company = getCompany(issue.companyId);
                  return (
                    <div
                      key={issue.id}
                      className="issue-item"
                      onClick={() => company && onSelectCompany && onSelectCompany(company)}
                    >
                      <div className="issue-company">{getCompanyName(issue.companyId)}</div>
                      <div className="issue-title">{issue.title}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {issues.length === 0 && (
        <div className="empty-state">No issues detected</div>
      )}
    </div>
  );
}
