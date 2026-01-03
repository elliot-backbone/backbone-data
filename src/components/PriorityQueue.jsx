import { computeAllDerivations } from '../lib/derivations';
import './PriorityQueue.css';

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  high: { label: 'HIGH', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  medium: { label: 'MEDIUM', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
  low: { label: 'LOW', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
};

export default function PriorityQueue({ rawData, resolvedPriorities = [], onSelectIssue, onSelectCompany }) {
  const result = computeAllDerivations({
    companies: rawData.companies || [],
    rounds: rawData.rounds || [],
    goals: rawData.goals || [],
    investors: rawData.investors || [],
    companyInvestors: rawData.companyInvestors || [],
    talent: rawData.talent || [],
    employees: rawData.employees || []
  }, resolvedPriorities);

  const priorities = result.l6?.topPriorities || [];
  const companies = result.l3?.companies || [];

  const getEntity = (priority) => {
    if (priority.entityType === 'company') {
      return companies.find(c => c.id === priority.entityId);
    } else if (priority.entityType === 'round') {
      const round = result.l3?.rounds?.find(r => r.id === priority.entityId);
      return companies.find(c => c.id === round?.companyId);
    } else if (priority.entityType === 'goal') {
      const goal = result.l3?.goals?.find(g => g.id === priority.entityId);
      return companies.find(c => c.id === goal?.companyId);
    }
    return null;
  };

  if (priorities.length === 0) {
    return (
      <div className="priority-queue">
        <h2>Priority Queue</h2>
        <div className="empty-state">No priorities detected. All clear.</div>
      </div>
    );
  }

  return (
    <div className="priority-queue">
      <div className="queue-header">
        <span className="queue-meta">
          {result.l6?.summary.totalPriorities || 0} priorities ·
          {result.l6?.summary.criticalCount || 0} critical ·
          Avg score: {result.l6?.summary.avgPriorityScore || 0}
        </span>
      </div>
      <div className="queue-list">
        {priorities.map((priority, index) => {
          const config = SEVERITY_CONFIG[priority.severity] || SEVERITY_CONFIG.medium;
          const entity = getEntity(priority);
          return (
            <div
              key={priority.id}
              onClick={() => onSelectIssue ? onSelectIssue(priority) : (entity && onSelectCompany && onSelectCompany(entity))}
              className="queue-item"
              style={{ borderLeftColor: config.color }}
            >
              <div className="item-rank">{index + 1}</div>
              <div className="item-content">
                <div className="item-header">
                  <span className="severity-badge" style={{ color: config.color, backgroundColor: config.bg }}>
                    {config.label}
                  </span>
                  <span className="company-name">{priority.entityName}</span>
                  <span className="priority-score" style={{
                    color: priority.priorityScore >= 80 ? '#ef4444' :
                           priority.priorityScore >= 60 ? '#f97316' : '#eab308',
                    fontWeight: 600,
                    marginLeft: 'auto'
                  }}>
                    {priority.priorityScore}
                  </span>
                </div>
                <div className="item-title">{priority.title}</div>
                <div className="item-action">
                  <span className="action-arrow">→</span>
                  <span className="action-text">{priority.resolutionTemplate}</span>
                </div>
                <div className="item-metrics">
                  <span className="metric">Impact: {priority.impactScore}</span>
                  <span className="metric">Effort: {priority.effortScore}</span>
                  <span className="metric">Urgency: {priority.urgencyScore}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
