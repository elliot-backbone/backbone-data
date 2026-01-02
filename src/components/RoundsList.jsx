import './RoundsList.css';

export default function RoundsList({ rawData, onSelectRound }) {
  const rounds = rawData.rounds || [];
  const companies = rawData.companies || [];

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };

  const sortedRounds = [...rounds].sort((a, b) =>
    new Date(b.closeDate) - new Date(a.closeDate)
  );

  const totalRaised = rounds.reduce((sum, r) => sum + r.amount, 0);
  const avgRoundSize = rounds.length > 0 ? totalRaised / rounds.length : 0;

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
    <div className="rounds-list">
      <div className="list-header">
        <div className="list-stats">
          <div className="stat-item">
            <span className="stat-value">{rounds.length}</span>
            <span className="stat-label">Total Rounds</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">${(totalRaised / 1000000).toFixed(1)}M</span>
            <span className="stat-label">Total Raised</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">${(avgRoundSize / 1000000).toFixed(1)}M</span>
            <span className="stat-label">Avg Round</span>
          </div>
        </div>
      </div>

      <div className="rounds-table">
        <div className="rounds-table-header">
          <div className="col-company">Company</div>
          <div className="col-stage">Stage</div>
          <div className="col-amount">Amount</div>
          <div className="col-date">Close Date</div>
          <div className="col-lead">Lead Investor</div>
        </div>
        <div className="rounds-table-body">
          {sortedRounds.map(round => (
            <div
              key={round.id}
              className="round-row"
              onClick={() => onSelectRound(round)}
            >
              <div className="col-company">
                <span className="company-name-link">{getCompanyName(round.companyId)}</span>
              </div>
              <div className="col-stage">
                <span
                  className="stage-badge"
                  style={{ background: getStageColor(round.stage) }}
                >
                  {round.stage}
                </span>
              </div>
              <div className="col-amount amount-value">
                ${(round.amount / 1000000).toFixed(2)}M
              </div>
              <div className="col-date">
                {new Date(round.closeDate).toLocaleDateString()}
              </div>
              <div className="col-lead">{round.leadInvestor}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
