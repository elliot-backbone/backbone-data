import { detectIssues } from '../lib/derivations';
import './PriorityDetail.css';

function calculateImpact(issue, companies, rounds, goals) {
  const company = companies.find(c => c.id === issue.companyId);
  if (!company) return { score: 0, unlocks: [] };

  const unlocks = [];
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
    unlocks.push({
      type: 'survival',
      description: 'Prevents company shutdown',
      impact: 'critical'
    });

    if (activeRound) {
      score += 40;
      unlocks.push({
        type: 'fundraise',
        description: `Unblocks ${activeRound.roundType} completion`,
        impact: 'high'
      });
    }

    blockedGoals.forEach(goal => {
      score += 20;
      unlocks.push({
        type: 'goal',
        description: `Enables "${goal.title}"`,
        impact: 'medium'
      });
    });
  }

  if (issue.type === 'revenue_viability') {
    score += 60;
    unlocks.push({
      type: 'economics',
      description: 'Improves unit economics',
      impact: 'high'
    });

    if (activeRound) {
      score += 30;
      unlocks.push({
        type: 'fundraise',
        description: 'Strengthens investor narrative',
        impact: 'medium'
      });
    }

    score += 25;
    unlocks.push({
      type: 'growth',
      description: 'Enables sustainable scaling',
      impact: 'medium'
    });
  }

  if (issue.type === 'attention_misallocation') {
    score += 40;
    unlocks.push({
      type: 'visibility',
      description: 'Restores information flow',
      impact: 'medium'
    });

    score += 20;
    unlocks.push({
      type: 'relationship',
      description: 'Prevents relationship decay',
      impact: 'low'
    });
  }

  if (issue.type === 'market_access') {
    score += 70;
    unlocks.push({
      type: 'fundraise',
      description: 'Accelerates round closure',
      impact: 'high'
    });

    score += 30;
    unlocks.push({
      type: 'network',
      description: 'Opens follow-on opportunities',
      impact: 'medium'
    });
  }

  if (issue.type === 'goal_risk') {
    score += 50;
    blockedGoals.slice(0, 2).forEach(goal => {
      unlocks.push({
        type: 'goal',
        description: `Unblocks "${goal.title}"`,
        impact: 'high'
      });
    });

    score += 20;
    unlocks.push({
      type: 'momentum',
      description: 'Restores execution velocity',
      impact: 'medium'
    });
  }

  return { score: Math.min(score, 100), unlocks };
}

export default function PriorityDetail({ issue, rawData, onBack, onSelectCompany }) {
  const company = (rawData.companies || []).find(c => c.id === issue.companyId);
  const companyIssues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [])
    .filter(i => i.companyId === issue.companyId);

  const { score: impactScore, unlocks } = calculateImpact(
    issue,
    rawData.companies || [],
    rawData.rounds || [],
    rawData.goals || []
  );

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'high') return '#f59e0b';
    if (severity === 'medium') return '#3b82f6';
    return '#64748b';
  };

  const getSeverityLabel = (severity) => {
    return severity.toUpperCase();
  };

  const getImpactColor = (score) => {
    if (score >= 80) return '#dc2626';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#6b7280';
  };

  const getUnlockColor = (impact) => {
    if (impact === 'critical') return '#dc2626';
    if (impact === 'high') return '#f97316';
    if (impact === 'medium') return '#3b82f6';
    return '#6b7280';
  };

  return (
    <div className="priority-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Priorities
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <div
            className="priority-company-link"
            onClick={() => company && onSelectCompany && onSelectCompany(company)}
            style={{ cursor: company ? 'pointer' : 'default' }}
          >
            {company?.name || 'Unknown Company'}
          </div>
          <h1 className="detail-title">{issue.title}</h1>
          <div className="header-badges">
            <span
              className="priority-severity-badge-large"
              style={{
                background: `${getSeverityColor(issue.severity)}15`,
                color: getSeverityColor(issue.severity)
              }}
            >
              {getSeverityLabel(issue.severity)}
            </span>
            <span
              className="impact-score-badge-large"
              style={{
                background: `${getImpactColor(impactScore)}15`,
                color: getImpactColor(impactScore)
              }}
            >
              IMPACT: {impactScore}
            </span>
          </div>
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

        {unlocks.length > 0 && (
          <div className="detail-section full-width">
            <h2 className="section-title">Ripple Effect - Downstream Unlocks ({unlocks.length})</h2>
            <div className="unlocks-grid">
              {unlocks.map((unlock, idx) => (
                <div key={idx} className="unlock-card">
                  <div
                    className="unlock-indicator"
                    style={{ background: getUnlockColor(unlock.impact) }}
                  />
                  <div className="unlock-content">
                    <div className="unlock-type">{unlock.type}</div>
                    <div className="unlock-description">{unlock.description}</div>
                    <div
                      className="unlock-impact-label"
                      style={{ color: getUnlockColor(unlock.impact) }}
                    >
                      {unlock.impact.toUpperCase()} IMPACT
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {companyIssues.length > 1 && (
          <div className="detail-section full-width">
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
