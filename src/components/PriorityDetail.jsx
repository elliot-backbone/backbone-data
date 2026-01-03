import { useState } from 'react';
import { detectIssues } from '../lib/derivations';
import { markPriorityResolved } from '../lib/supabase';
import { applyResolution, getResolutionSummary } from '../lib/resolutionHandlers';
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

export default function PriorityDetail({ issue, rawData, onBack, onSelectCompany, onSelectIssue, onSelectGoal, onResolved, onDataUpdate }) {
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveInterstitial, setShowResolveInterstitial] = useState(false);
  const company = (rawData.companies || []).find(c => c.id === issue.companyId);
  const companyIssues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], [])
    .filter(i => i.companyId === issue.companyId);

  const handleResolveClick = () => {
    setShowResolveInterstitial(true);
  };

  const handleConfirmResolve = async () => {
    setIsResolving(true);
    const resolutionSummary = getResolutionSummary(issue);

    try {
      await markPriorityResolved(issue.companyId, issue.category, issue.title, resolutionSummary);

      const updatedData = applyResolution(issue, rawData);

      if (onDataUpdate) {
        onDataUpdate(updatedData);
      }

      if (onResolved) {
        onResolved();
      }

      onBack();
    } catch (error) {
      console.error('Failed to resolve priority:', error);
      setIsResolving(false);
      setShowResolveInterstitial(false);
    }
  };

  const handleCancelResolve = () => {
    setShowResolveInterstitial(false);
  };

  const { score: impactScore, unlocks } = calculateImpact(
    issue,
    rawData.companies || [],
    rawData.rounds || [],
    rawData.goals || []
  );

  const goals = rawData.goals || [];
  const companyGoals = goals.filter(g => g.company_id === company?.id);

  const getSeverityClass = (severity) => {
    if (severity === 'critical') return 'severity-critical';
    if (severity === 'high') return 'severity-high';
    if (severity === 'medium') return 'severity-medium';
    return 'severity-low';
  };

  const getImpactClass = (score) => {
    if (score >= 80) return 'impact-critical';
    if (score >= 60) return 'impact-high';
    if (score >= 40) return 'impact-medium';
    return 'impact-low';
  };

  const getUnlockImpactClass = (impact) => {
    if (impact === 'critical') return 'unlock-critical';
    if (impact === 'high') return 'unlock-high';
    if (impact === 'medium') return 'unlock-medium';
    return 'unlock-low';
  };

  const resolutionSummary = getResolutionSummary(issue);

  if (showResolveInterstitial) {
    return (
      <div className="priority-detail">
        <div className="resolve-interstitial">
          <div className="interstitial-card">
            <div className="interstitial-icon">⚠️</div>
            <h2 className="interstitial-title">Confirm Resolution</h2>
            <p className="interstitial-subtitle">This action will modify underlying data and recalculate all priorities</p>

            <div className="resolution-summary-box">
              <div className="resolution-label">Changes to be applied:</div>
              <div className="resolution-text">{resolutionSummary}</div>
            </div>

            <div className="interstitial-actions">
              <button
                className="interstitial-btn cancel"
                onClick={handleCancelResolve}
                disabled={isResolving}
              >
                Cancel
              </button>
              <button
                className="interstitial-btn confirm"
                onClick={handleConfirmResolve}
                disabled={isResolving}
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="priority-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Priorities
      </button>

      <div className={`priority-hero ${getSeverityClass(issue.severity)}`}>
        <div className="hero-top">
          <div
            className="hero-company"
            onClick={() => company && onSelectCompany && onSelectCompany(company)}
          >
            {company?.name || 'Unknown Company'}
          </div>
          <button
            className="hero-resolve-btn"
            onClick={handleResolveClick}
            disabled={isResolving}
          >
            <span className="resolve-icon">✓</span>
            Resolve
          </button>
        </div>

        <h1 className="hero-title">{issue.title}</h1>

        <div className="hero-description">
          {issue.description || issue.title}
        </div>

        <div className="hero-action">
          <div className="action-label">Recommended Action</div>
          <div className="action-text">{issue.suggestedAction}</div>
        </div>
      </div>

      <div className="priority-body">
        <div className={`entity-card company-card ${getImpactClass(impactScore)}`}>
          <div className="card-shine"></div>
          <div className="card-header">
            <div className="card-title">Company Profile</div>
            <div className="card-badge">{issue.type.replace(/_/g, ' ')}</div>
          </div>
          <div className="card-body">
            <div className="card-name">{company?.name || 'Unknown'}</div>
            <div className="card-stats">
              <div className="stat-item">
                <div className="stat-label">ARR</div>
                <div className="stat-value">${(company?.arr / 1000000 || 0).toFixed(2)}M</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Runway</div>
                <div className="stat-value">{company?.runway?.toFixed(1) || 0}mo</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Burn</div>
                <div className="stat-value">${(company?.monthlyBurn / 1000 || 0).toFixed(0)}K</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Growth</div>
                <div className="stat-value">{((company?.revenueGrowthRate || 0) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {unlocks.length > 0 && (
          <div className="ripple-section">
            <div className="section-header">
              <span className="section-icon">⚡</span>
              <h3 className="section-title">Ripple Effect</h3>
              <span className="section-count">{unlocks.length}</span>
            </div>
            <div className="ripple-grid">
              {unlocks.map((unlock, idx) => {
                const linkedGoal = unlock.type === 'goal' && companyGoals.find(g =>
                  unlock.description.toLowerCase().includes(g.title.toLowerCase())
                );
                const isClickable = linkedGoal && onSelectGoal;

                return (
                  <div
                    key={idx}
                    className={`ripple-card ${getUnlockImpactClass(unlock.impact)} ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && onSelectGoal(linkedGoal)}
                  >
                    <div className="ripple-card-shine"></div>
                    <div className="ripple-type">{unlock.type}</div>
                    <div className="ripple-description">{unlock.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {companyIssues.length > 1 && (
          <div className="related-section">
            <div className="section-header">
              <span className="section-icon">🔗</span>
              <h3 className="section-title">Related Issues</h3>
              <span className="section-count">{companyIssues.length - 1}</span>
            </div>
            <div className="related-grid">
              {companyIssues
                .filter(i => i.id !== issue.id)
                .map((relatedIssue, idx) => (
                  <div
                    key={idx}
                    className={`related-card ${getSeverityClass(relatedIssue.severity)} clickable`}
                    onClick={() => onSelectIssue && onSelectIssue(relatedIssue)}
                  >
                    <div className="related-card-shine"></div>
                    <div className="related-title">{relatedIssue.title}</div>
                    <div className="related-type">{relatedIssue.type.replace(/_/g, ' ')}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
