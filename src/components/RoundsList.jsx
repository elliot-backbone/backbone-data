import './RoundsList.css';

export default function RoundsList({ rawData, onSelectRound }) {
  const allRounds = rawData.rounds || [];
  const companies = rawData.companies || [];
  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  const rounds = allRounds.filter(round => {
    const companyId = round.companyId || round.company_id;
    return portfolioCompanies.some(c => c.id === companyId);
  });

  const getCompanyName = (round) => {
    const companyId = round.companyId || round.company_id;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };

  const sortedRounds = [...rounds].sort((a, b) =>
    new Date(b.closeDate || b.targetCloseDate) - new Date(a.closeDate || a.targetCloseDate)
  );

  const totalRaised = rounds.reduce((sum, r) => sum + (r.amount || r.targetAmount || 0), 0);
  const avgRoundSize = rounds.length > 0 ? totalRaised / rounds.length : 0;

  const getStageColor = (stage) => {
    const normalized = (stage || '').toLowerCase().replace(/_/g, ' ');
    const colors = {
      'seed': '#10b981',
      'pre seed': '#10b981',
      'series a': '#3b82f6',
      'series b': '#8b5cf6',
      'series c': '#ec4899',
      'series d+': '#f59e0b',
      'bridge': '#f59e0b'
    };
    return colors[normalized] || '#64748b';
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
          {sortedRounds.map(round => {
            const stage = round.stage || round.roundType || 'Unknown';
            return (
              <div
                key={round.id}
                className="round-row"
                onClick={() => onSelectRound(round)}
              >
                <div className="col-company">
                  <span className="company-name-link">{getCompanyName(round)}</span>
                </div>
                <div className="col-stage">
                  <span
                    className="stage-badge"
                    style={{ background: getStageColor(stage) }}
                  >
                    {stage}
                  </span>
                </div>
                <div className="col-amount amount-value">
                  ${((round.amount || round.targetAmount) / 1000000).toFixed(2)}M
                </div>
                <div className="col-date">
                  {new Date(round.closeDate || round.targetCloseDate).toLocaleDateString()}
                </div>
                <div className="col-lead">{round.leadInvestor || 'TBD'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
