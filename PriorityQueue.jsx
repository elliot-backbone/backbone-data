import './PriorityQueue.css';

const SEVERITY_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  high: { label: 'HIGH', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  medium: { label: 'MEDIUM', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
  low: { label: 'LOW', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
};

export default function PriorityQueue({ issues, companies, onSelectItem }) {
  const getCompanyName = (companyId) => companies.find(c => c.id === companyId)?.name || 'Unknown';

  if (issues.length === 0) {
    return (
      <div className="priority-queue">
        <h2>Priority Queue</h2>
        <div className="empty-state">No issues detected. All clear.</div>
      </div>
    );
  }

  return (
    <div className="priority-queue">
      <div className="queue-header">
        <h2>Priority Queue</h2>
        <span className="queue-meta">{issues.length} issues · {issues.filter(i => i.severity === 'critical').length} critical</span>
      </div>
      <div className="queue-list">
        {issues.map((issue, index) => {
          const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
          return (
            <div
              key={issue.id}
              onClick={() => onSelectItem(issue)}
              className="queue-item"
              style={{ borderLeftColor: config.color }}
            >
              <div className="item-rank">{index + 1}</div>
              <div className="item-content">
                <div className="item-header">
                  <span className="severity-badge" style={{ color: config.color, backgroundColor: config.bg }}>
                    {config.label}
                  </span>
                  <span className="company-name">{getCompanyName(issue.companyId)}</span>
                </div>
                <div className="item-title">{issue.title}</div>
                <div className="item-action">
                  <span className="action-arrow">→</span>
                  <span className="action-text">{issue.suggestedAction}</span>
                </div>
              </div>
              <div className="item-actions">
                <button className="action-btn primary">Act</button>
                <button className="action-btn secondary" onClick={(e) => { e.stopPropagation(); onSelectItem(issue); }}>Why</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
