import './FirmDetail.css';

const FIRM_TYPE_LABELS = {
  vc: 'Venture Capital',
  angel_syndicate: 'Angel Syndicate',
  family_office: 'Family Office',
  corporate_vc: 'Corporate VC',
  accelerator: 'Accelerator'
};

export default function FirmDetail({ firm, rawData, onBack, onSelectPerson, onSelectDeal, onSelectCompany }) {
  const people = (rawData.people || []).filter(p => p.firm_id === firm.id);
  const deals = (rawData.deals || []).filter(d => d.firm_id === firm.id);
  const rounds = rawData.rounds || [];
  const companies = rawData.companies || [];

  const enrichedDeals = deals.map(deal => {
    const round = rounds.find(r => r.id === deal.round_id);
    const company = companies.find(c => c.id === round?.company_id);
    const person = people.find(p => p.id === deal.person_id);

    return {
      ...deal,
      round,
      company,
      person
    };
  });

  const activeDeals = enrichedDeals.filter(d =>
    ['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
  );

  const closedDeals = enrichedDeals.filter(d => d.dealStage === 'closed');
  const passedDeals = enrichedDeals.filter(d => d.dealStage === 'passed');

  const totalInvested = closedDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
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
    <div className="firm-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Firms
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{firm.name}</h1>
          <div className="firm-badges">
            <span className="entity-id" style={{ marginRight: '0.5rem' }}>ID: {firm.id}</span>
            <span className="firm-type-badge-large">
              {FIRM_TYPE_LABELS[firm.firmType] || firm.firmType}
            </span>
          </div>
        </div>
        <div className="detail-amount-box">
          <div className="amount-label">Total Invested</div>
          <div className="amount-value-large">{formatCurrency(totalInvested)}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Firm Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-item-label">Type</div>
              <div className="detail-item-value">{FIRM_TYPE_LABELS[firm.firmType] || firm.firmType}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Typical Check Size</div>
              <div className="detail-item-value">
                {formatCurrency(firm.typicalCheckMin)} - {formatCurrency(firm.typicalCheckMax)}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Stage Focus</div>
              <div className="detail-item-value">{firm.stageFocus || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">People</div>
              <div className="detail-item-value">{people.length}</div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Deal Activity</h2>
          <div className="activity-stats">
            <div className="activity-stat-box">
              <div className="activity-stat-value">{activeDeals.length}</div>
              <div className="activity-stat-label">Active Deals</div>
            </div>
            <div className="activity-stat-box">
              <div className="activity-stat-value">{closedDeals.length}</div>
              <div className="activity-stat-label">Closed Deals</div>
            </div>
            <div className="activity-stat-box">
              <div className="activity-stat-value">{passedDeals.length}</div>
              <div className="activity-stat-label">Passed</div>
            </div>
          </div>
        </div>

        {people.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">People ({people.length})</h2>
            <div className="people-list">
              {people.map(person => (
                <div
                  key={person.id}
                  className="person-item clickable"
                  onClick={() => onSelectPerson && onSelectPerson(person)}
                >
                  <div className="person-name">{person.firstName} {person.lastName}</div>
                  <div className="person-title">{person.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {enrichedDeals.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Deals ({enrichedDeals.length})</h2>
            <div className="deals-list">
              {enrichedDeals.map(deal => (
                <div
                  key={deal.id}
                  className="deal-item clickable"
                  onClick={() => onSelectDeal && onSelectDeal(deal)}
                >
                  <div className="deal-main">
                    <div className="deal-info">
                      <div
                        className="deal-company-name clickable-text"
                        onClick={(e) => {
                          e.stopPropagation();
                          deal.company && onSelectCompany && onSelectCompany(deal.company);
                        }}
                      >
                        {deal.company?.name || 'Unknown'}
                      </div>
                      <div
                        className="deal-person-name clickable-text"
                        onClick={(e) => {
                          e.stopPropagation();
                          deal.person && onSelectPerson && onSelectPerson(deal.person);
                        }}
                      >
                        {deal.person?.firstName} {deal.person?.lastName}
                      </div>
                    </div>
                    <div className="deal-stage-badge" style={{ background: getDealStageColor(deal.dealStage) }}>
                      {getDealStageLabel(deal.dealStage)}
                    </div>
                  </div>
                  {deal.amount && (
                    <div className="deal-amount">{formatCurrency(deal.amount)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
