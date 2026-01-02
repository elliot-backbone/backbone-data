import { detectIssues } from '../lib/derivations';
import './PriorityDetail.css';

export default function PriorityDetail({ issue, rawData, onBack }) {
  const company = (rawData.companies || []).find(c => c.id === issue.companyId);
  const companyIssues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [])
    .filter(i => i.companyId === issue.companyId);

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'high') return '#f59e0b';
    if (severity === 'medium') return '#3b82f6';
    return '#64748b';
  };

  const getSeverityLabel = (severity) => {
    return severity.toUpperCase();
  };

  return (
    <div className="priority-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Priorities
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <div className="priority-company-link">{company?.name || 'Unknown Company'}</div>
          <h1 className="detail-title">{issue.title}</h1>
          <span
            className="priority-severity-badge-large"
            style={{
              background: `${getSeverityColor(issue.severity)}15`,
              color: getSeverityColor(issue.severity)
            }}
          >
            {getSeverityLabel(issue.severity)}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Issue Details</h2>
          <div className="issue-details-box">
            <div className="detail-row">
              <div className="detail-row-label">Type</div>
              <div className="detail-row-value">{issue.type}</div>
            </div>
            <div className="detail-row">
              <div className="detail-row-label">Severity</div>
              <div className="detail-row-value">
                <span style={{ color: getSeverityColor(issue.severity) }}>
                  {getSeverityLabel(issue.severity)}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-row-label">Description</div>
              <div className="detail-row-value">{issue.description || issue.title}</div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Suggested Action</h2>
          <div className="action-box">
            <div className="action-icon">→</div>
            <div className="action-text">{issue.suggestedAction}</div>
          </div>
        </div>

        {company && (
          <div className="detail-section">
            <h2 className="section-title">Company Context</h2>
            <div className="company-context-grid">
              <div className="context-stat">
                <div className="context-stat-label">ARR</div>
                <div className="context-stat-value">${(company.arr / 1000000).toFixed(2)}M</div>
              </div>
              <div className="context-stat">
                <div className="context-stat-label">Runway</div>
                <div className="context-stat-value">{company.runway.toFixed(1)} months</div>
              </div>
              <div className="context-stat">
                <div className="context-stat-label">Monthly Burn</div>
                <div className="context-stat-value">${(company.monthlyBurn / 1000).toFixed(0)}K</div>
              </div>
              <div className="context-stat">
                <div className="context-stat-label">Growth Rate</div>
                <div className="context-stat-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}

        {companyIssues.length > 1 && (
          <div className="detail-section">
            <h2 className="section-title">Related Issues ({companyIssues.length - 1})</h2>
            <div className="related-issues-list">
              {companyIssues
                .filter(i => i.id !== issue.id)
                .map((relatedIssue, idx) => (
                  <div key={idx} className="related-issue-item">
                    <span
                      className="related-severity"
                      style={{
                        background: `${getSeverityColor(relatedIssue.severity)}15`,
                        color: getSeverityColor(relatedIssue.severity)
                      }}
                    >
                      {getSeverityLabel(relatedIssue.severity)}
                    </span>
                    <span className="related-title">{relatedIssue.title}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
