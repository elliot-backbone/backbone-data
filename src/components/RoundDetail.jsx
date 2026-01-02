import './RoundDetail.css';

export default function RoundDetail({ round, rawData, onBack }) {
  const company = (rawData.companies || []).find(c => c.id === (round.companyId || round.company_id));

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

  return (
    <div className="round-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Rounds
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <h1 className="detail-title">{company?.name || 'Unknown Company'}</h1>
          <div className="detail-subtitle">
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
      </div>
    </div>
  );
}
