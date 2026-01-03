import { useState } from 'react';
import './GoalsList.css';

export default function GoalsList({ rawData, onSelectGoal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const goals = rawData.goals || [];
  const companies = rawData.companies || [];
  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  const portfolioGoals = goals.filter(goal => {
    const companyId = goal.companyId || goal.company_id;
    return portfolioCompanies.some(c => c.id === companyId);
  });

  const getCompanyName = (goal) => {
    const companyId = goal.companyId || goal.company_id;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };

  const filteredGoals = portfolioGoals.filter(goal => {
    const companyName = getCompanyName(goal);
    const metric = goal.metric || goal.title || '';

    return searchTerm === '' ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metric.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const onTrackGoals = filteredGoals.filter(g => g.isOnTrack).length;
  const offTrackGoals = filteredGoals.filter(g => !g.isOnTrack).length;
  const upcomingDeadlines = filteredGoals.filter(g => {
    const deadline = new Date(g.deadline || g.targetDate);
    const now = new Date();
    const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
    return daysUntil <= 30 && daysUntil > 0;
  }).length;

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (a.isOnTrack !== b.isOnTrack) return a.isOnTrack ? 1 : -1;
    return new Date(a.deadline || a.targetDate) - new Date(b.deadline || b.targetDate);
  });

  const getProgressPercentage = (goal) => {
    const current = parseFloat(goal.currentValue);
    const target = parseFloat(goal.targetValue);
    if (isNaN(current) || isNaN(target) || target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  };

  const getDaysUntilDeadline = (goal) => {
    const deadline = goal.deadline || goal.targetDate;
    const now = new Date();
    const target = new Date(deadline);
    const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="goals-list">
      <div className="list-header">
        <div className="list-stats">
          <div className="stat-item">
            <span className="stat-value">{filteredGoals.length}</span>
            <span className="stat-label">Total Goals</span>
          </div>
          <div className="stat-item">
            <span className="stat-value on-track">{onTrackGoals}</span>
            <span className="stat-label">On Track</span>
          </div>
          <div className="stat-item">
            <span className="stat-value off-track">{offTrackGoals}</span>
            <span className="stat-label">Off Track</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{upcomingDeadlines}</span>
            <span className="stat-label">Due Soon</span>
          </div>
        </div>
      </div>

      <div className="goals-controls">
        <input
          type="text"
          placeholder="Search goals..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="goals-grid">
        {sortedGoals.map(goal => {
          const daysUntil = getDaysUntilDeadline(goal);
          const progress = getProgressPercentage(goal);

          return (
            <div
              key={goal.id}
              className={`goal-card ${!goal.isOnTrack ? 'off-track-card' : ''}`}
              onClick={() => onSelectGoal(goal)}
            >
              <div className="goal-card-header">
                <div className="goal-company">{getCompanyName(goal)}</div>
                <span className={`goal-status-badge ${goal.isOnTrack ? 'on-track' : 'off-track'}`}>
                  {goal.isOnTrack ? 'On Track' : 'Off Track'}
                </span>
              </div>

              <h3 className="goal-metric-name">{goal.metric || goal.title}</h3>

              <div className="goal-progress-section">
                <div className="goal-values">
                  <div className="goal-current">
                    <span className="value-label">Current</span>
                    <span className="value-number">
                      {goal.metric === 'MRR' || goal.title?.toLowerCase().includes('mrr')
                        ? `$${(parseFloat(goal.currentValue) / 1000).toFixed(1)}K`
                        : goal.currentValue}
                    </span>
                  </div>
                  <div className="goal-arrow">→</div>
                  <div className="goal-target">
                    <span className="value-label">Target</span>
                    <span className="value-number">
                      {goal.metric === 'MRR' || goal.title?.toLowerCase().includes('mrr')
                        ? `$${(parseFloat(goal.targetValue) / 1000).toFixed(1)}K`
                        : goal.targetValue}
                    </span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: goal.isOnTrack ? '#10b981' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              <div className="goal-deadline">
                <span className={`deadline-text ${daysUntil <= 30 ? 'urgent' : ''}`}>
                  {daysUntil > 0 ? `${daysUntil} days remaining` : `${Math.abs(daysUntil)} days overdue`}
                </span>
                <span className="deadline-date">
                  {new Date(goal.deadline || goal.targetDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {sortedGoals.length === 0 && (
        <div className="empty-state">No goals found</div>
      )}
    </div>
  );
}
