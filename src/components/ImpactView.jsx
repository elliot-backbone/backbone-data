import { detectIssues } from '../lib/derivations';
import './ImpactView.css';

function calculateImpact(issue, companies, rounds, goals) {
  const company = companies.find(c => c.id === issue.companyId);
  if (!company) return { score: 0, unlocks: [] };

  const unlocks = [];
  let score = 0;

  const companyRounds = rounds.filter(r => r.companyId === company.id);
  const activeRound = companyRounds.find(r => r.status === 'active' || r.status === 'closing');

  const companyGoals = goals.filter(g => g.companyId === company.id);
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

export default function ImpactView({ rawData, onSelectCompany }) {
  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const companies = rawData.companies || [];
  const rounds = rawData.rounds || [];
  const goals = rawData.goals || [];

  const enrichedIssues = issues.map(issue => {
    const company = companies.find(c => c.id === issue.companyId);
    const { score, unlocks } = calculateImpact(issue, companies, rounds, goals);
    return {
      ...issue,
      company,
      impactScore: score,
      unlocks
    };
  });

  const sortedByImpact = [...enrichedIssues].sort((a, b) => b.impactScore - a.impactScore);

  const highImpactIssues = sortedByImpact.filter(i => i.impactScore >= 70);
  const mediumImpactIssues = sortedByImpact.filter(i => i.impactScore >= 40 && i.impactScore < 70);
  const totalPotentialUnlocks = sortedByImpact.reduce((sum, i) => sum + i.unlocks.length, 0);

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
    <div className="impact-view">
      <div className="impact-header">
        <div className="impact-stats">
          <div className="impact-stat">
            <span className="impact-stat-value">{highImpactIssues.length}</span>
            <span className="impact-stat-label">High Impact Issues</span>
          </div>
          <div className="impact-stat">
            <span className="impact-stat-value">{mediumImpactIssues.length}</span>
            <span className="impact-stat-label">Medium Impact</span>
          </div>
          <div className="impact-stat">
            <span className="impact-stat-value">{totalPotentialUnlocks}</span>
            <span className="impact-stat-label">Total Unlocks</span>
          </div>
        </div>
      </div>

      <div className="impact-grid">
        {sortedByImpact.slice(0, 20).map(issue => (
          <div
            key={issue.id}
            className="impact-card"
            onClick={() => issue.company && onSelectCompany && onSelectCompany(issue.company)}
          >
            <div className="impact-card-header">
              <div className="impact-company-info">
                <h3 className="impact-company-name">{issue.company?.name || 'Unknown'}</h3>
                <p className="impact-issue-title">{issue.title}</p>
              </div>
              <div
                className="impact-score-badge"
                style={{ background: getImpactColor(issue.impactScore) }}
              >
                {issue.impactScore}
              </div>
            </div>

            <div className="impact-action">
              <div className="impact-action-label">Suggested Action</div>
              <div className="impact-action-text">{issue.suggestedAction}</div>
            </div>

            {issue.unlocks.length > 0 && (
              <div className="unlocks-section">
                <div className="unlocks-header">Downstream Unlocks ({issue.unlocks.length})</div>
                <div className="unlocks-list">
                  {issue.unlocks.map((unlock, idx) => (
                    <div key={idx} className="unlock-item">
                      <div
                        className="unlock-indicator"
                        style={{ background: getUnlockColor(unlock.impact) }}
                      />
                      <div className="unlock-content">
                        <div className="unlock-description">{unlock.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedByImpact.length === 0 && (
        <div className="empty-state">No issues to analyze for impact</div>
      )}
    </div>
  );
}
