import { useState } from 'react';
import './DealsPipeline.css';

const DEAL_STAGES = [
  { key: 'identified', label: 'Identified', color: '#9ca3af' },
  { key: 'contacted', label: 'Contacted', color: '#6b7280' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled', color: '#3b82f6' },
  { key: 'meeting_held', label: 'Meeting Held', color: '#3b82f6' },
  { key: 'diligence', label: 'Diligence', color: '#8b5cf6' },
  { key: 'term_sheet', label: 'Term Sheet', color: '#10b981' },
  { key: 'committed', label: 'Committed', color: '#059669' },
  { key: 'closed', label: 'Closed', color: '#047857' },
  { key: 'dropped', label: 'Dropped', color: '#ef4444' }
];

export default function DealsPipeline({ rawData, onSelectDeal }) {
  const [viewMode, setViewMode] = useState('list');
  const deals = rawData.deals || [];
  const rounds = rawData.rounds || [];
  const companies = rawData.companies || [];
  const people = rawData.people || [];
  const firms = rawData.firms || [];

  const enrichedDeals = deals.map(deal => {
    const round = rounds.find(r => r.id === deal.roundId);
    const company = companies.find(c => c.id === round?.companyId);
    const person = people.find(p => p.id === deal.personId);
    const firm = firms.find(f => f.id === deal.firmId);

    return {
      ...deal,
      companyName: company?.name || 'Unknown',
      roundType: round?.roundType || 'unknown',
      investorName: person ? `${person.firstName} ${person.lastName}` : 'Unknown',
      firmName: firm?.name || 'Unknown',
      company,
      round
    };
  });

  const portfolioDeals = enrichedDeals.filter(d => d.company?.isPortfolio);

  const stageCounts = DEAL_STAGES.map(stage => ({
    ...stage,
    count: portfolioDeals.filter(d => d.dealStage === stage.key).length
  }));

  const totalDeals = portfolioDeals.length;
  const activeStages = stageCounts.filter(s => !['closed', 'dropped'].includes(s.key));
  const activeDealCount = activeStages.reduce((sum, s) => sum + s.count, 0);
  const closedCount = stageCounts.find(s => s.key === 'closed')?.count || 0;
  const droppedCount = stageCounts.find(s => s.key === 'dropped')?.count || 0;

  const conversionRate = totalDeals > 0 ? (closedCount / totalDeals * 100).toFixed(1) : 0;

  const activeDeals = portfolioDeals.filter(d =>
    ['contacted', 'meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
  );

  const sortedActiveDeals = [...activeDeals].sort((a, b) => {
    const stageOrder = DEAL_STAGES.map(s => s.key);
    return stageOrder.indexOf(b.dealStage) - stageOrder.indexOf(a.dealStage);
  });

  const getStageConfig = (stageKey) => DEAL_STAGES.find(s => s.key === stageKey) || DEAL_STAGES[0];

  return (
    <div className="deals-pipeline">
      <div className="pipeline-header">
        <div className="pipeline-stats">
          <div className="pipeline-stat">
            <span className="stat-value">{activeDealCount}</span>
            <span className="stat-label">Active Deals</span>
          </div>
          <div className="pipeline-stat">
            <span className="stat-value" style={{ color: '#10b981' }}>{closedCount}</span>
            <span className="stat-label">Closed</span>
          </div>
          <div className="pipeline-stat">
            <span className="stat-value" style={{ color: '#ef4444' }}>{droppedCount}</span>
            <span className="stat-label">Dropped</span>
          </div>
          <div className="pipeline-stat">
            <span className="stat-value">{conversionRate}%</span>
            <span className="stat-label">Conversion</span>
          </div>
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'funnel' ? 'active' : ''}`}
            onClick={() => setViewMode('funnel')}
          >
            Funnel
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'funnel' ? (
        <div className="funnel-view">
          {stageCounts.map((stage, idx) => {
            const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
            const widthPercent = (stage.count / maxCount) * 100;

            return (
              <div key={stage.key} className="funnel-stage">
                <div className="stage-label">
                  <span className="stage-name">{stage.label}</span>
                  <span className="stage-count">{stage.count}</span>
                </div>
                <div className="stage-bar-container">
                  <div
                    className="stage-bar"
                    style={{
                      width: `${widthPercent}%`,
                      background: stage.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="deals-list-view">
          {sortedActiveDeals.map(deal => {
            const stageConfig = getStageConfig(deal.dealStage);
            const daysSinceContact = deal.lastContactDate
              ? Math.floor((Date.now() - new Date(deal.lastContactDate)) / 86400000)
              : null;

            return (
              <div key={deal.id} className="deal-card" onClick={() => onSelectDeal && onSelectDeal(deal)}>
                <div className="deal-header">
                  <div className="deal-company">
                    <h3 className="deal-company-name">{deal.companyName}</h3>
                    <span className="deal-round-type">{deal.roundType.replace('_', ' ')}</span>
                  </div>
                  <span
                    className="deal-stage-badge"
                    style={{
                      background: `${stageConfig.color}15`,
                      color: stageConfig.color
                    }}
                  >
                    {stageConfig.label}
                  </span>
                </div>
                <div className="deal-details">
                  <div className="deal-investor">
                    <span className="detail-label">Investor:</span>
                    <span className="detail-value">{deal.investorName}</span>
                  </div>
                  <div className="deal-firm">
                    <span className="detail-label">Firm:</span>
                    <span className="detail-value">{deal.firmName}</span>
                  </div>
                  {deal.expectedAmount && (
                    <div className="deal-amount">
                      <span className="detail-label">Expected:</span>
                      <span className="detail-value">
                        ${(deal.expectedAmount / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  )}
                  {daysSinceContact !== null && (
                    <div className="deal-contact">
                      <span className="detail-label">Last Contact:</span>
                      <span className="detail-value">{daysSinceContact}d ago</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {portfolioDeals.length === 0 && (
        <div className="empty-state">No deals found</div>
      )}
    </div>
  );
}
