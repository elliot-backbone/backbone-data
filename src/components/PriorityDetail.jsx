import { useState } from 'react';
import { detectIssues } from '../lib/derivations';
import { markPriorityResolved } from '../lib/supabase';
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

export default function PriorityDetail({ issue, rawData, onBack, onSelectCompany, onSelectIssue, onSelectGoal, onResolved }) {
  const [isResolving, setIsResolving] = useState(false);
  const company = (rawData.companies || []).find(c => c.id === issue.companyId);
  const companyIssues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], [])
    .filter(i => i.companyId === issue.companyId);

  const handleResolve = async () => {
    if (!confirm('Mark this priority as resolved? This will remove it from the priority queue.')) {
      return;
    }

    setIsResolving(true);
    try {
      await markPriorityResolved(issue.companyId, issue.category, issue.title);
      if (onResolved) {
        onResolved();
      }
      onBack();
    } catch (error) {
      console.error('Failed to resolve priority:', error);
      alert('Failed to resolve priority. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const { score: impactScore, unlocks } = calculateImpact(
    issue,
    rawData.companies || [],
    rawData.rounds || [],
    rawData.goals || []
  );

  const goals = rawData.goals || [];
  const companyGoals = goals.filter(g => g.company_id === company?.id);

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

      <div className="detail-header-compact">
        <div className="header-row">
          <div
            className="priority-company-link"
            onClick={() => company && onSelectCompany && onSelectCompany(company)}
            style={{ cursor: company ? 'pointer' : 'default' }}
          >
            {company?.name || 'Unknown Company'}
          </div>
          <div className="header-badges-inline">
            <span
              className="badge-compact"
              style={{
                background: `${getSeverityColor(issue.severity)}15`,
                color: getSeverityColor(issue.severity)
              }}
            >
              {getSeverityLabel(issue.severity)}
            </span>
            <span
              className="badge-compact"
              style={{
                background: `${getImpactColor(impactScore)}15`,
                color: getImpactColor(impactScore)
              }}
            >
              IMPACT {impactScore}
            </span>
          </div>
        </div>
        <h1 className="detail-title-compact">{issue.title}</h1>
      </div>

      <div className="content-compact">
        <div className="action-primary">
          <span className="action-label">ACTION</span>
          {issue.suggestedAction}
        </div>

        <button
          className="resolve-btn"
          onClick={handleResolve}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Mark as Resolved'}
        </button>

        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Type</span>
            <span className="meta-value">{issue.type.replace(/_/g, ' ')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Description</span>
            <span className="meta-value">{issue.description || issue.title}</span>
          </div>
        </div>

        {company && (
          <div className="context-bar">
            <span className="context-stat-inline">
              <span className="stat-label">ARR</span>
              <span className="stat-value">${(company.arr / 1000000).toFixed(2)}M</span>
            </span>
            <span className="context-stat-inline">
              <span className="stat-label">Runway</span>
              <span className="stat-value">{company.runway.toFixed(1)}mo</span>
            </span>
            <span className="context-stat-inline">
              <span className="stat-label">Burn</span>
              <span className="stat-value">${(company.monthlyBurn / 1000).toFixed(0)}K/mo</span>
            </span>
            <span className="context-stat-inline">
              <span className="stat-label">Growth</span>
              <span className="stat-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</span>
            </span>
          </div>
        )}

        {unlocks.length > 0 && (
          <div className="section-compact">
            <div className="section-header-compact">
              <span className="section-icon">⚡</span>
              <span className="section-title-compact">Ripple Effect ({unlocks.length})</span>
            </div>
            <div className="unlocks-compact">
              {unlocks.map((unlock, idx) => {
                const linkedGoal = unlock.type === 'goal' && companyGoals.find(g =>
                  unlock.description.toLowerCase().includes(g.title.toLowerCase())
                );
                const isClickable = linkedGoal && onSelectGoal;

                return (
                  <div
                    key={idx}
                    className={`unlock-compact ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && onSelectGoal(linkedGoal)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <span
                      className="unlock-dot"
                      style={{ background: getUnlockColor(unlock.impact) }}
                    />
                    <span className="unlock-type-compact">{unlock.type}</span>
                    <span className="unlock-text">{unlock.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {companyIssues.length > 1 && (
          <div className="section-compact">
            <div className="section-header-compact">
              <span className="section-icon">🔗</span>
              <span className="section-title-compact">Related Issues ({companyIssues.length - 1})</span>
            </div>
            <div className="related-issues-compact">
              {companyIssues
                .filter(i => i.id !== issue.id)
                .map((relatedIssue, idx) => (
                  <div
                    key={idx}
                    className="related-issue-compact clickable"
                    onClick={() => onSelectIssue && onSelectIssue(relatedIssue)}
                  >
                    <span
                      className="severity-dot"
                      style={{ background: getSeverityColor(relatedIssue.severity) }}
                    />
                    <span className="related-text">{relatedIssue.title}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
