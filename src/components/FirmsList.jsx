import { useState } from 'react';
import './FirmsList.css';

const FIRM_TYPE_LABELS = {
  vc: 'Venture Capital',
  angel_syndicate: 'Angel Syndicate',
  family_office: 'Family Office',
  corporate_vc: 'Corporate VC',
  accelerator: 'Accelerator'
};

export default function FirmsList({ rawData, onSelectFirm }) {
  const [filterType, setFilterType] = useState('all');
  const firms = rawData.firms || [];
  const people = rawData.people || [];
  const allDeals = rawData.deals || [];
  const companies = rawData.companies || [];
  const rounds = rawData.rounds || [];

  const portfolioCompanies = companies.filter(c => c.isPortfolio);
  const portfolioRounds = rounds.filter(round => {
    const companyId = round.companyId || round.company_id;
    return portfolioCompanies.some(c => c.id === companyId);
  });

  const deals = allDeals.filter(deal => {
    return portfolioRounds.some(r => r.id === deal.round_id);
  });

  const enrichedFirms = firms.map(firm => {
    const investors = people.filter(p => p.firm_id === firm.id);
    const firmDeals = deals.filter(d => d.firm_id === firm.id);
    const activeDeals = firmDeals.filter(d =>
      ['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
    );
    const closedDeals = firmDeals.filter(d => d.dealStage === 'closed');

    return {
      ...firm,
      investorCount: investors.length,
      totalDeals: firmDeals.length,
      activeDeals: activeDeals.length,
      closedDeals: closedDeals.length
    };
  });

  const filteredFirms = filterType === 'all'
    ? enrichedFirms
    : enrichedFirms.filter(f => f.firmType === filterType);

  const sortedFirms = [...filteredFirms].sort((a, b) => b.activeDeals - a.activeDeals);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="firms-list">
      <div className="firms-controls">
        <div className="filter-chips">
          <button
            className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Firms ({firms.length})
          </button>
          {Object.entries(FIRM_TYPE_LABELS).map(([type, label]) => {
            const count = firms.filter(f => f.firmType === type).length;
            return (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="firms-grid">
        {sortedFirms.map(firm => (
          <div
            key={firm.id}
            className="firm-card"
            onClick={() => onSelectFirm && onSelectFirm(firm)}
          >
            <div className="firm-header">
              <h3 className="firm-name">{firm.name}</h3>
              <span className="firm-type-badge">
                {FIRM_TYPE_LABELS[firm.firmType] || firm.firmType}
              </span>
            </div>

            <div className="firm-metrics">
              <div className="firm-metric">
                <span className="metric-label">Check Size</span>
                <span className="metric-value">
                  {formatCurrency(firm.typicalCheckMin)} - {formatCurrency(firm.typicalCheckMax)}
                </span>
              </div>
              <div className="firm-metric">
                <span className="metric-label">Investors</span>
                <span className="metric-value">{firm.investorCount}</span>
              </div>
            </div>

            <div className="firm-activity">
              <div className="activity-stat">
                <span className="activity-value active">{firm.activeDeals}</span>
                <span className="activity-label">Active</span>
              </div>
              <div className="activity-stat">
                <span className="activity-value closed">{firm.closedDeals}</span>
                <span className="activity-label">Closed</span>
              </div>
              <div className="activity-stat">
                <span className="activity-value total">{firm.totalDeals}</span>
                <span className="activity-label">Total</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedFirms.length === 0 && (
        <div className="empty-state">No firms found</div>
      )}
    </div>
  );
}
