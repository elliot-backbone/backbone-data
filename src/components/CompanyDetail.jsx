import { detectIssues, calculateHealth } from '../lib/derivations';
import './CompanyDetail.css';

export default function CompanyDetail({ company, rawData, onBack, onSelectRound, onSelectGoal }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || []);
  const healthScore = calculateHealth(company, issues);
  const companyIssues = issues.filter(i => i.companyId === company.id);
  const companyRounds = (rawData.rounds || []).filter(r => (r.companyId || r.company_id) === company.id);
  const companyGoals = (rawData.goals || []).filter(g => (g.companyId || g.company_id) === company.id);

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

  return (
    <div className="company-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Companies
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{company.name}</h1>
          <div className="detail-badges">
            <span className="detail-badge">{company.sector}</span>
            {company.isPortfolio && <span className="detail-badge portfolio">Portfolio</span>}
          </div>
        </div>
        <div className="detail-health">
          <div
            className="detail-health-circle"
            style={{ borderColor: getHealthColor(healthScore) }}
          >
            <span style={{ color: getHealthColor(healthScore) }}>{healthScore}</span>
          </div>
          <div className="detail-health-label">Health Score</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Key Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-box-label">Annual Recurring Revenue</div>
              <div className="metric-box-value">${(company.arr / 1000000).toFixed(2)}M</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Monthly Burn</div>
              <div className="metric-box-value">${(company.monthlyBurn / 1000).toFixed(0)}K</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Runway</div>
              <div className="metric-box-value">{company.runway.toFixed(1)} months</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Revenue Growth</div>
              <div className="metric-box-value">{(company.revenueGrowthRate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">Gross Margin</div>
              <div className="metric-box-value">{(company.grossMargin * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-box">
              <div className="metric-box-label">CAC Payback</div>
              <div className="metric-box-value">{company.cacPayback} months</div>
            </div>
          </div>
        </div>

        {companyIssues.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Active Issues ({companyIssues.length})</h2>
            <div className="issues-list">
              {companyIssues.map((issue, idx) => (
                <div key={idx} className="issue-item">
                  <div className="issue-header">
                    <span
                      className="issue-severity"
                      style={{ background: getSeverityColor(issue.severity) }}
                    >
                      {issue.severity}
                    </span>
                    <span className="issue-type">{issue.type}</span>
                  </div>
                  <div className="issue-description">{issue.title || issue.description}</div>
                  <div className="issue-action">{issue.suggestedAction}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2 className="section-title">Funding Rounds ({companyRounds.length})</h2>
          {companyRounds.length > 0 ? (
            <div className="rounds-list">
              {companyRounds.map(round => (
                <div
                  key={round.id}
                  className="round-item clickable"
                  onClick={() => onSelectRound && onSelectRound(round)}
                >
                  <div className="round-info">
                    <div className="round-stage">{round.stage || round.roundType}</div>
                    <div className="round-date">{new Date(round.closeDate || round.targetCloseDate).toLocaleDateString()}</div>
                  </div>
                  <div className="round-amount">${((round.amount || round.targetAmount) / 1000000).toFixed(2)}M</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No funding rounds recorded</div>
          )}
        </div>

        <div className="detail-section">
          <h2 className="section-title">Goals ({companyGoals.length})</h2>
          {companyGoals.length > 0 ? (
            <div className="goals-list">
              {companyGoals.map(goal => (
                <div
                  key={goal.id}
                  className="goal-item clickable"
                  onClick={() => onSelectGoal && onSelectGoal(goal)}
                >
                  <div className="goal-header">
                    <span className="goal-metric">{goal.metric || goal.title}</span>
                    <span className={`goal-status ${goal.isOnTrack ? 'on-track' : 'off-track'}`}>
                      {goal.isOnTrack ? 'On Track' : 'Off Track'}
                    </span>
                  </div>
                  <div className="goal-details">
                    <div className="goal-progress">
                      Current: <strong>{goal.currentValue}</strong>
                    </div>
                    <div className="goal-target">
                      Target: <strong>{goal.targetValue}</strong>
                    </div>
                    <div className="goal-deadline">
                      Due: {new Date(goal.deadline || goal.targetDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No goals set</div>
          )}
        </div>
      </div>
    </div>
  );
}
