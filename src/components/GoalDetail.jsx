import './GoalDetail.css';

export default function GoalDetail({ goal, rawData, onBack }) {
  const company = (rawData.companies || []).find(c => c.id === (goal.companyId || goal.company_id));

  const getProgressPercentage = () => {
    const current = parseFloat(goal.currentValue);
    const target = parseFloat(goal.targetValue);
    if (isNaN(current) || isNaN(target) || target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  };

  const getDaysUntilDeadline = () => {
    const deadline = goal.deadline || goal.targetDate;
    const now = new Date();
    const target = new Date(deadline);
    const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  const progress = getProgressPercentage();
  const daysUntil = getDaysUntilDeadline();

  return (
    <div className="goal-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Goals
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <div className="goal-company-link">{company?.name || 'Unknown Company'}</div>
          <h1 className="detail-title">{goal.metric || goal.title}</h1>
          <span className={`goal-status-badge-large ${goal.isOnTrack ? 'on-track' : 'off-track'}`}>
            {goal.isOnTrack ? 'On Track' : 'Off Track'}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Progress</h2>
          <div className="progress-visualization">
            <div className="progress-stats">
              <div className="progress-stat">
                <div className="progress-stat-label">Current Value</div>
                <div className="progress-stat-value current">{goal.currentValue}</div>
              </div>
              <div className="progress-stat">
                <div className="progress-stat-label">Target Value</div>
                <div className="progress-stat-value target">{goal.targetValue}</div>
              </div>
              <div className="progress-stat">
                <div className="progress-stat-label">Progress</div>
                <div className="progress-stat-value progress">{progress.toFixed(1)}%</div>
              </div>
            </div>
            <div className="progress-bar-large">
              <div
                className="progress-fill-large"
                style={{
                  width: `${progress}%`,
                  background: goal.isOnTrack ? '#10b981' : '#ef4444'
                }}
              />
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Timeline</h2>
          <div className="timeline-info">
            <div className="timeline-item">
              <div className="timeline-label">Deadline</div>
              <div className="timeline-value">
                {new Date(goal.deadline || goal.targetDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Days Remaining</div>
              <div className={`timeline-value ${daysUntil <= 30 ? 'urgent' : ''}`}>
                {daysUntil > 0 ? `${daysUntil} days` : `${Math.abs(daysUntil)} days overdue`}
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Status</div>
              <div className="timeline-value">
                {goal.isOnTrack ? 'Trending toward target' : 'Needs attention'}
              </div>
            </div>
          </div>
        </div>

        {company && (
          <div className="detail-section">
            <h2 className="section-title">Company Context</h2>
            <div className="company-context">
              <div className="context-item">
                <div className="context-label">Company</div>
                <div className="context-value">{company.name}</div>
              </div>
              <div className="context-item">
                <div className="context-label">Sector</div>
                <div className="context-value">{company.sector}</div>
              </div>
              <div className="context-item">
                <div className="context-label">ARR</div>
                <div className="context-value">${(company.arr / 1000000).toFixed(2)}M</div>
              </div>
              <div className="context-item">
                <div className="context-label">Growth Rate</div>
                <div className="context-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</div>
              </div>
              <div className="context-item">
                <div className="context-label">Runway</div>
                <div className="context-value">{company.runway.toFixed(1)} months</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
