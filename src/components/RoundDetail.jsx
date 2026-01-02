import './RoundDetail.css';

export default function RoundDetail({ round, rawData, onBack, onSelectCompany, onSelectDeal, onSelectFirm, onSelectPerson }) {
  const company = (rawData.companies || []).find(c => c.id === (round.companyId || round.company_id));
  const deals = (rawData.deals || []).filter(d => d.round_id === round.id);
  const firms = rawData.firms || [];
  const people = rawData.people || [];

  const getStageColor = (stage) => {
    const colors = {
      'Seed': '#10b981',
      'Series A': '#3b82f6',
      'Series B': '#8b5cf6',
      'Series C': '#ec4899',
      'Series D+': '#f59e0b'
    };
    return colors[stage] || '#64748b';
  };

  const getDealStageLabel = (stage) => {
    const labels = {
      'initial_contact': 'Initial Contact',
      'meeting_scheduled': 'Meeting Scheduled',
      'meeting_held': 'Meeting Held',
      'diligence': 'Due Diligence',
      'term_sheet': 'Term Sheet',
      'committed': 'Committed',
      'closed': 'Closed',
      'passed': 'Passed'
    };
    return labels[stage] || stage;
  };

  const getDealStageColor = (stage) => {
    const colors = {
      'initial_contact': '#94a3b8',
      'meeting_scheduled': '#60a5fa',
      'meeting_held': '#3b82f6',
      'diligence': '#8b5cf6',
      'term_sheet': '#a855f7',
      'committed': '#10b981',
      'closed': '#059669',
      'passed': '#64748b'
    };
    return colors[stage] || '#64748b';
  };

  return (
    <div className="round-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Rounds
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1
            className="detail-title clickable"
            onClick={() => company && onSelectCompany && onSelectCompany(company)}
          >
            {company?.name || 'Unknown Company'}
          </h1>
          <div className="detail-subtitle">
            <span className="entity-id" style={{ marginRight: '0.5rem' }}>ID: {round.id}</span>
            <span
              className="stage-badge-large"
              style={{ background: getStageColor(round.stage || round.roundType) }}
            >
              {round.stage || round.roundType}
            </span>
            <span className="round-date-large">
              Closed {new Date(round.closeDate || round.targetCloseDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="detail-amount-box">
          <div className="amount-label">Round Size</div>
          <div className="amount-value-large">${((round.amount || round.targetAmount) / 1000000).toFixed(2)}M</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Round Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-item-label">Lead Investor</div>
              <div className="detail-item-value">{round.leadInvestor || 'TBD'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Stage</div>
              <div className="detail-item-value">{round.stage || round.roundType}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Amount Raised</div>
              <div className="detail-item-value">${((round.amount || round.targetAmount) / 1000000).toFixed(2)}M</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Close Date</div>
              <div className="detail-item-value">
                {new Date(round.closeDate || round.targetCloseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {company && (
          <div className="detail-section">
            <h2 className="section-title">Company Snapshot</h2>
            <div className="company-snapshot">
              <div className="snapshot-item">
                <div className="snapshot-label">Sector</div>
                <div className="snapshot-value">{company.sector}</div>
              </div>
              <div className="snapshot-item">
                <div className="snapshot-label">ARR at Close</div>
                <div className="snapshot-value">${(company.arr / 1000000).toFixed(2)}M</div>
              </div>
              <div className="snapshot-item">
                <div className="snapshot-label">Growth Rate</div>
                <div className="snapshot-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</div>
              </div>
              <div className="snapshot-item">
                <div className="snapshot-label">Gross Margin</div>
                <div className="snapshot-value">{(company.grossMargin * 100).toFixed(0)}%</div>
              </div>
              <div className="snapshot-item">
                <div className="snapshot-label">Monthly Burn</div>
                <div className="snapshot-value">${(company.monthlyBurn / 1000).toFixed(0)}K</div>
              </div>
              <div className="snapshot-item">
                <div className="snapshot-label">Runway</div>
                <div className="snapshot-value">{company.runway} months</div>
              </div>
            </div>
          </div>
        )}

        {deals.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Associated Deals ({deals.length})</h2>
            <div className="deals-list">
              {deals.map(deal => {
                const firm = firms.find(f => f.id === deal.firm_id);
                const person = people.find(p => p.id === deal.person_id);
                return (
                  <div
                    key={deal.id}
                    className="deal-item clickable"
                    onClick={() => onSelectDeal && onSelectDeal(deal)}
                  >
                    <div className="deal-main">
                      <div className="deal-investor">
                        <div
                          className="deal-firm-name clickable-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            firm && onSelectFirm && onSelectFirm(firm);
                          }}
                        >
                          {firm?.name || 'Unknown Firm'}
                        </div>
                        <div
                          className="deal-person-name clickable-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            person && onSelectPerson && onSelectPerson(person);
                          }}
                        >
                          {person?.name || 'No contact'}
                        </div>
                      </div>
                      <div className="deal-stage-badge" style={{ background: getDealStageColor(deal.dealStage) }}>
                        {getDealStageLabel(deal.dealStage)}
                      </div>
                    </div>
                    {deal.amount && (
                      <div className="deal-amount">${(deal.amount / 1000000).toFixed(2)}M</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
