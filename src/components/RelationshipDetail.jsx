import './RelationshipDetail.css';

export default function RelationshipDetail({ relationship, rawData, onBack }) {
  const { company, person, firm, dealStage, introducedBy } = relationship;

  const deals = (rawData.deals || []).filter(d =>
    d.person_id === person.id &&
    (rawData.rounds || []).find(r => r.id === d.round_id && r.company_id === company.id)
  );

  const getStageColor = (stage) => {
    const colors = {
      'meeting_scheduled': '#3b82f6',
      'meeting_held': '#3b82f6',
      'diligence': '#8b5cf6',
      'term_sheet': '#10b981',
      'committed': '#059669',
      'closed': '#047857',
      'dropped': '#ef4444'
    };
    return colors[stage] || '#9ca3af';
  };

  const getStageLabel = (stage) => {
    return stage.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const firstContact = deals.length > 0
    ? Math.min(...deals.map(d => d.lastContactDate ? new Date(d.lastContactDate).getTime() : Date.now()))
    : null;

  const daysSinceFirstContact = firstContact
    ? Math.floor((Date.now() - firstContact) / 86400000)
    : null;

  return (
    <div className="relationship-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Network
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{company.name} ↔ {firm.name}</h1>
          <div className="detail-subtitle">
            <span className="entity-id" style={{ marginRight: '0.5rem' }}>ID: {relationship.id}</span>
            <span className="investor-name-text">
              {person.firstName} {person.lastName}
            </span>
            <span className="investor-title-text">{person.title}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Company</h2>
          <div className="entity-info-box">
            <div className="entity-name">{company.name}</div>
            <div className="entity-details">
              <div className="entity-detail-item">
                <span className="entity-detail-label">Sector:</span>
                <span className="entity-detail-value">{company.sector}</span>
              </div>
              <div className="entity-detail-item">
                <span className="entity-detail-label">ARR:</span>
                <span className="entity-detail-value">${(company.arr / 1000000).toFixed(2)}M</span>
              </div>
              <div className="entity-detail-item">
                <span className="entity-detail-label">Growth:</span>
                <span className="entity-detail-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Investor</h2>
          <div className="entity-info-box">
            <div className="entity-name">{person.firstName} {person.lastName}</div>
            <div className="entity-details">
              <div className="entity-detail-item">
                <span className="entity-detail-label">Firm:</span>
                <span className="entity-detail-value">{firm.name}</span>
              </div>
              <div className="entity-detail-item">
                <span className="entity-detail-label">Title:</span>
                <span className="entity-detail-value">{person.title}</span>
              </div>
              <div className="entity-detail-item">
                <span className="entity-detail-label">Email:</span>
                <span className="entity-detail-value">{person.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2 className="section-title">Relationship Status</h2>
          <div className="status-info-box">
            <div className="detail-row">
              <div className="detail-row-label">Current Stage</div>
              <div className="detail-row-value">
                <span
                  className="stage-badge"
                  style={{
                    background: `${getStageColor(dealStage)}15`,
                    color: getStageColor(dealStage)
                  }}
                >
                  {getStageLabel(dealStage)}
                </span>
              </div>
            </div>
            {introducedBy && (
              <div className="detail-row">
                <div className="detail-row-label">Introduced By</div>
                <div className="detail-row-value">
                  {introducedBy.firstName} {introducedBy.lastName}
                </div>
              </div>
            )}
            {daysSinceFirstContact !== null && (
              <div className="detail-row">
                <div className="detail-row-label">Relationship Age</div>
                <div className="detail-row-value">{daysSinceFirstContact} days</div>
              </div>
            )}
            <div className="detail-row">
              <div className="detail-row-label">Active Interactions</div>
              <div className="detail-row-value">{deals.length}</div>
            </div>
          </div>
        </div>

        {introducedBy && (
          <div className="detail-section">
            <h2 className="section-title">Introduction Source</h2>
            <div className="intro-source-box">
              <div className="intro-source-name">
                {introducedBy.firstName} {introducedBy.lastName}
              </div>
              <div className="intro-source-details">
                <div className="intro-source-item">
                  <span className="intro-source-label">Role:</span>
                  <span className="intro-source-value">{introducedBy.role}</span>
                </div>
                <div className="intro-source-item">
                  <span className="intro-source-label">Title:</span>
                  <span className="intro-source-value">{introducedBy.title}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {deals.length > 0 && (
          <div className="detail-section full-width">
            <h2 className="section-title">Interaction History ({deals.length})</h2>
            <div className="interactions-timeline">
              {deals.map(deal => {
                const round = (rawData.rounds || []).find(r => r.id === deal.round_id);
                const daysSinceContact = deal.lastContactDate
                  ? Math.floor((Date.now() - new Date(deal.lastContactDate)) / 86400000)
                  : null;

                return (
                  <div key={deal.id} className="interaction-item">
                    <div className="interaction-header">
                      <span
                        className="interaction-stage"
                        style={{
                          background: `${getStageColor(deal.dealStage)}15`,
                          color: getStageColor(deal.dealStage)
                        }}
                      >
                        {getStageLabel(deal.dealStage)}
                      </span>
                      <span className="interaction-round">
                        {round?.roundType?.replace('_', ' ') || 'Unknown Round'}
                      </span>
                    </div>
                    <div className="interaction-meta">
                      {deal.expectedAmount && (
                        <span>Expected: ${(deal.expectedAmount / 1000000).toFixed(1)}M</span>
                      )}
                      {daysSinceContact !== null && (
                        <span>Last contact: {daysSinceContact}d ago</span>
                      )}
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
