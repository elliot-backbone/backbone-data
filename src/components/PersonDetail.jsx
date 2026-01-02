import './PersonDetail.css';

const ROLE_LABELS = {
  founder: 'Founder',
  investor: 'Investor',
  operator: 'Operator',
  advisor: 'Advisor',
  employee: 'Employee'
};

const DEAL_STAGES = [
  { key: 'identified', label: 'Identified'},
  { key: 'contacted', label: 'Contacted' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { key: 'meeting_held', label: 'Meeting Held' },
  { key: 'diligence', label: 'Diligence' },
  { key: 'term_sheet', label: 'Term Sheet' },
  { key: 'committed', label: 'Committed' },
  { key: 'closed', label: 'Closed' },
  { key: 'dropped', label: 'Dropped' }
];

export default function PersonDetail({ person, rawData, onBack, onSelectFirm, onSelectDeal, onSelectCompany, onSelectRound }) {
  const firm = (rawData.firms || []).find(f => f.id === person.firm_id);
  const deals = (rawData.deals || []).filter(d => d.person_id === person.id);
  const rounds = rawData.rounds || [];
  const companies = rawData.companies || [];

  const enrichedDeals = deals.map(deal => {
    const round = rounds.find(r => r.id === deal.round_id);
    const company = companies.find(c => c.id === round?.company_id);
    const stageConfig = DEAL_STAGES.find(s => s.key === deal.dealStage);

    return {
      ...deal,
      round,
      company,
      stageLabel: stageConfig?.label || 'Unknown'
    };
  });

  const activeDeals = enrichedDeals.filter(d =>
    ['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
  );

  const closedDeals = enrichedDeals.filter(d => d.dealStage === 'closed');
  const droppedDeals = enrichedDeals.filter(d => d.dealStage === 'dropped');

  const introsProvided = (rawData.deals || []).filter(d => d.introducedBy_id === person.id);

  const daysSinceContact = person.lastContactedAt
    ? Math.floor((Date.now() - new Date(person.lastContactedAt)) / 86400000)
    : null;

  const getContactFreshness = (days) => {
    if (days === null) return { label: 'Never', color: '#9ca3af' };
    if (days < 7) return { color: '#10b981' };
    if (days < 30) return { color: '#3b82f6' };
    if (days < 90) return { color: '#f59e0b' };
    return { color: '#ef4444' };
  };

  const freshness = getContactFreshness(daysSinceContact);

  return (
    <div className="person-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to People
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{person.firstName} {person.lastName}</h1>
          <div className="detail-subtitle">
            <span className="entity-id" style={{ marginRight: '0.5rem' }}>ID: {person.id}</span>
            <span className="person-title-text">{person.title}</span>
            {firm && (
              <span
                className="person-firm-link clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFirm && onSelectFirm(firm);
                }}
              >
                {firm.name}
              </span>
            )}
          </div>
          <div className="person-badges">
            <span className="role-badge-large">{ROLE_LABELS[person.role]}</span>
            {daysSinceContact !== null && (
              <span className="contact-badge" style={{ color: freshness.color }}>
                Last contact: {daysSinceContact}d ago
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Contact Information</h2>
          <div className="contact-info-box">
            <div className="detail-row">
              <div className="detail-row-label">Email</div>
              <div className="detail-row-value">{person.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-row-label">Role</div>
              <div className="detail-row-value">{ROLE_LABELS[person.role]}</div>
            </div>
            {firm && (
              <div className="detail-row">
                <div className="detail-row-label">Firm</div>
                <div className="detail-row-value">{firm.name}</div>
              </div>
            )}
            {person.linkedinUrl && (
              <div className="detail-row">
                <div className="detail-row-label">LinkedIn</div>
                <div className="detail-row-value">
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="external-link">
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Activity Summary</h2>
          <div className="activity-stats-grid">
            <div className="activity-stat-box">
              <div className="activity-stat-value">{activeDeals.length}</div>
              <div className="activity-stat-label">Active Deals</div>
            </div>
            <div className="activity-stat-box">
              <div className="activity-stat-value">{closedDeals.length}</div>
              <div className="activity-stat-label">Closed</div>
            </div>
            <div className="activity-stat-box">
              <div className="activity-stat-value">{droppedDeals.length}</div>
              <div className="activity-stat-label">Dropped</div>
            </div>
            <div className="activity-stat-box">
              <div className="activity-stat-value">{introsProvided.length}</div>
              <div className="activity-stat-label">Intros Made</div>
            </div>
          </div>
        </div>

        {enrichedDeals.length > 0 && (
          <div className="detail-section full-width">
            <h2 className="section-title">Deal History ({enrichedDeals.length})</h2>
            <div className="deals-history-list">
              {enrichedDeals.map(deal => (
                <div
                  key={deal.id}
                  className="deal-history-item clickable"
                  onClick={() => onSelectDeal && onSelectDeal(deal)}
                >
                  <div className="deal-history-header">
                    <div
                      className="deal-history-company clickable-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        deal.company && onSelectCompany && onSelectCompany(deal.company);
                      }}
                    >
                      {deal.company?.name || 'Unknown'}
                    </div>
                    <span className="deal-history-stage">{deal.stageLabel}</span>
                  </div>
                  <div className="deal-history-meta">
                    <span
                      className="clickable-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        deal.round && onSelectRound && onSelectRound(deal.round);
                      }}
                    >
                      {deal.round?.roundType?.replace('_', ' ') || 'Unknown Round'}
                    </span>
                    {deal.expectedAmount && (
                      <span>${(deal.expectedAmount / 1000000).toFixed(1)}M</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {introsProvided.length > 0 && (
          <div className="detail-section full-width">
            <h2 className="section-title">Introductions Made ({introsProvided.length})</h2>
            <div className="intros-list">
              {introsProvided.map(intro => {
                const introRound = rounds.find(r => r.id === intro.round_id);
                const introCompany = companies.find(c => c.id === introRound?.company_id);
                const introInvestor = (rawData.people || []).find(p => p.id === intro.person_id);

                return (
                  <div key={intro.id} className="intro-item">
                    <div className="intro-company">{introCompany?.name || 'Unknown'}</div>
                    <div className="intro-arrow">→</div>
                    <div className="intro-investor">
                      {introInvestor ? `${introInvestor.firstName} ${introInvestor.lastName}` : 'Unknown'}
                    </div>
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
