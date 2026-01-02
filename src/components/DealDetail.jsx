import './DealDetail.css';

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

export default function DealDetail({ deal, rawData, onBack }) {
  const round = (rawData.rounds || []).find(r => r.id === deal.round_id);
  const company = (rawData.companies || []).find(c => c.id === round?.company_id);
  const person = (rawData.people || []).find(p => p.id === deal.person_id);
  const firm = (rawData.firms || []).find(f => f.id === deal.firm_id);
  const introducedBy = deal.introducedBy_id
    ? (rawData.people || []).find(p => p.id === deal.introducedBy_id)
    : null;

  const stageConfig = DEAL_STAGES.find(s => s.key === deal.dealStage) || DEAL_STAGES[0];

  const daysSinceContact = deal.lastContactDate
    ? Math.floor((Date.now() - new Date(deal.lastContactDate)) / 86400000)
    : null;

  return (
    <div className="deal-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Deals
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{company?.name || 'Unknown Company'}</h1>
          <div className="detail-subtitle">
            <span className="round-type-badge">{round?.roundType?.replace('_', ' ') || 'Unknown Round'}</span>
            <span
              className="deal-stage-badge-large"
              style={{
                background: `${stageConfig.color}15`,
                color: stageConfig.color
              }}
            >
              {stageConfig.label}
            </span>
          </div>
        </div>
        {deal.expectedAmount && (
          <div className="detail-amount-box">
            <div className="amount-label">Expected Investment</div>
            <div className="amount-value-large">${(deal.expectedAmount / 1000000).toFixed(2)}M</div>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h2 className="section-title">Investor Details</h2>
          {person && (
            <div className="investor-details-box">
              <div className="detail-row">
                <div className="detail-row-label">Name</div>
                <div className="detail-row-value">{person.firstName} {person.lastName}</div>
              </div>
              <div className="detail-row">
                <div className="detail-row-label">Title</div>
                <div className="detail-row-value">{person.title}</div>
              </div>
              <div className="detail-row">
                <div className="detail-row-label">Email</div>
                <div className="detail-row-value">{person.email}</div>
              </div>
              {firm && (
                <div className="detail-row">
                  <div className="detail-row-label">Firm</div>
                  <div className="detail-row-value">{firm.name}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="detail-section">
          <h2 className="section-title">Deal Status</h2>
          <div className="status-details-box">
            <div className="detail-row">
              <div className="detail-row-label">Current Stage</div>
              <div className="detail-row-value">
                <span style={{ color: stageConfig.color }}>{stageConfig.label}</span>
              </div>
            </div>
            {daysSinceContact !== null && (
              <div className="detail-row">
                <div className="detail-row-label">Last Contact</div>
                <div className="detail-row-value">{daysSinceContact} days ago</div>
              </div>
            )}
            {deal.isLead !== undefined && (
              <div className="detail-row">
                <div className="detail-row-label">Lead Investor</div>
                <div className="detail-row-value">{deal.isLead ? 'Yes' : 'No'}</div>
              </div>
            )}
            {introducedBy && (
              <div className="detail-row">
                <div className="detail-row-label">Introduced By</div>
                <div className="detail-row-value">
                  {introducedBy.firstName} {introducedBy.lastName}
                </div>
              </div>
            )}
          </div>
        </div>

        {company && (
          <div className="detail-section">
            <h2 className="section-title">Company Snapshot</h2>
            <div className="company-snapshot-grid">
              <div className="snapshot-stat">
                <div className="snapshot-stat-label">Sector</div>
                <div className="snapshot-stat-value">{company.sector}</div>
              </div>
              <div className="snapshot-stat">
                <div className="snapshot-stat-label">ARR</div>
                <div className="snapshot-stat-value">${(company.arr / 1000000).toFixed(2)}M</div>
              </div>
              <div className="snapshot-stat">
                <div className="snapshot-stat-label">Growth Rate</div>
                <div className="snapshot-stat-value">{(company.revenueGrowthRate * 100).toFixed(0)}%</div>
              </div>
              <div className="snapshot-stat">
                <div className="snapshot-stat-label">Runway</div>
                <div className="snapshot-stat-value">{company.runway.toFixed(1)} months</div>
              </div>
            </div>
          </div>
        )}

        {round && (
          <div className="detail-section">
            <h2 className="section-title">Round Information</h2>
            <div className="round-info-box">
              <div className="detail-row">
                <div className="detail-row-label">Round Type</div>
                <div className="detail-row-value">{round.roundType?.replace('_', ' ')}</div>
              </div>
              <div className="detail-row">
                <div className="detail-row-label">Target Amount</div>
                <div className="detail-row-value">${((round.targetAmount || round.amount) / 1000000).toFixed(2)}M</div>
              </div>
              <div className="detail-row">
                <div className="detail-row-label">Target Close Date</div>
                <div className="detail-row-value">
                  {new Date(round.targetCloseDate || round.closeDate).toLocaleDateString()}
                </div>
              </div>
              {round.leadInvestor && (
                <div className="detail-row">
                  <div className="detail-row-label">Lead Investor</div>
                  <div className="detail-row-value">{round.leadInvestor}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
