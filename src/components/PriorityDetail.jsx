import { useState } from 'react';
import { computeAllDerivations } from '../lib/derivations';
import { markPriorityResolved } from '../lib/supabase';
import { applyResolution, getResolutionSummary } from '../lib/resolutionHandlers';
import './PriorityDetail.css';

export default function PriorityDetail({ issue, rawData, onBack, onSelectCompany, onSelectIssue, onSelectGoal, onResolved, onDataUpdate }) {
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveInterstitial, setShowResolveInterstitial] = useState(false);

  const result = computeAllDerivations({
    companies: rawData.companies || [],
    rounds: rawData.rounds || [],
    goals: rawData.goals || [],
    investors: rawData.investors || [],
    companyInvestors: rawData.companyInvestors || [],
    talent: rawData.talent || [],
    employees: rawData.employees || []
  }, []);

  const companies = result.l3?.companies || [];
  const company = companies.find(c => c.id === issue.entityId ||
    (issue.entityType === 'round' && result.l3?.rounds?.find(r => r.id === issue.entityId)?.companyId === c.id) ||
    (issue.entityType === 'goal' && result.l3?.goals?.find(g => g.id === issue.entityId)?.companyId === c.id)
  );

  const companyPriorities = (result.l5?.priorities || [])
    .filter(p => {
      if (p.entityId === issue.entityId) return false;
      if (p.entityType === 'company' && p.entityId === company?.id) return true;
      if (p.entityType === 'round') {
        const round = result.l3?.rounds?.find(r => r.id === p.entityId);
        return round?.companyId === company?.id;
      }
      if (p.entityType === 'goal') {
        const goal = result.l3?.goals?.find(g => g.id === p.entityId);
        return goal?.companyId === company?.id;
      }
      return false;
    });

  const handleResolveClick = () => {
    setShowResolveInterstitial(true);
  };

  const handleConfirmResolve = async () => {
    setIsResolving(true);
    const resolutionSummary = getResolutionSummary(issue);

    try {
      await markPriorityResolved(issue.entityId, issue.entityType, issue.category, issue.title, resolutionSummary);

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

  const goals = result.l3?.goals || [];
  const companyGoals = goals.filter(g => g.companyId === company?.id);

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

  const getScoreColor = (score) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
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
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-label">Priority Score</div>
            <div className="metric-value" style={{ color: getScoreColor(issue.priorityScore) }}>
              {issue.priorityScore}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Impact</div>
            <div className="metric-value" style={{ color: getScoreColor(issue.impactScore) }}>
              {issue.impactScore}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Urgency</div>
            <div className="metric-value" style={{ color: getScoreColor(issue.urgencyScore) }}>
              {issue.urgencyScore}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Effort</div>
            <div className="metric-value" style={{ color: getScoreColor(100 - issue.effortScore) }}>
              {issue.effortScore}
            </div>
          </div>
        </div>

        <div className={`entity-card company-card ${getImpactClass(issue.impactScore)}`}>
          <div className="card-shine"></div>
          <div className="card-header">
            <div className="card-title">Company Health</div>
            <div className="card-badge">{issue.category.replace(/_/g, ' ')}</div>
          </div>
          <div className="card-body">
            <div className="card-name">{company?.name || 'Unknown'}</div>
            <div className="card-stats">
              <div className="stat-item">
                <div className="stat-label">Overall</div>
                <div className="stat-value" style={{ color: getScoreColor(company?.overallHealth) }}>
                  {company?.overallHealth || 0}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Capital</div>
                <div className="stat-value" style={{ color: getScoreColor(company?.capitalHealth) }}>
                  {company?.capitalHealth || 0}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Revenue</div>
                <div className="stat-value" style={{ color: getScoreColor(company?.revenueHealth) }}>
                  {company?.revenueHealth || 0}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Operational</div>
                <div className="stat-value" style={{ color: getScoreColor(company?.operationalHealth) }}>
                  {company?.operationalHealth || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {issue.resolutionSteps && issue.resolutionSteps.length > 0 && (
          <div className="resolution-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <h3 className="section-title">{issue.resolutionTemplate}</h3>
            </div>
            <div className="resolution-steps">
              {issue.resolutionSteps.map((step, idx) => (
                <div key={idx} className="resolution-step">
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-text">{step}</div>
                </div>
              ))}
            </div>
            {issue.dependencies && issue.dependencies.length > 0 && (
              <div className="resolution-meta">
                <div className="meta-label">Dependencies:</div>
                <div className="meta-value">{issue.dependencies.join(', ')}</div>
              </div>
            )}
            {issue.cascadeEffect && (
              <div className="resolution-meta">
                <div className="meta-label">Cascade Effect:</div>
                <div className="meta-value">{issue.cascadeEffect}</div>
              </div>
            )}
          </div>
        )}

        {companyPriorities.length > 0 && (
          <div className="related-section">
            <div className="section-header">
              <span className="section-icon">🔗</span>
              <h3 className="section-title">Related Priorities</h3>
              <span className="section-count">{companyPriorities.length}</span>
            </div>
            <div className="related-grid">
              {companyPriorities
                .slice(0, 6)
                .map((relatedPriority, idx) => (
                  <div
                    key={idx}
                    className={`related-card ${getSeverityClass(relatedPriority.severity)} clickable`}
                    onClick={() => onSelectIssue && onSelectIssue(relatedPriority)}
                  >
                    <div className="related-card-shine"></div>
                    <div className="related-title">{relatedPriority.title}</div>
                    <div className="related-type">{relatedPriority.category.replace(/_/g, ' ')}</div>
                    <div className="related-score" style={{ color: getScoreColor(relatedPriority.priorityScore) }}>
                      {relatedPriority.priorityScore}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
