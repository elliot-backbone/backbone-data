import { useState } from 'react';
import './FirmsList.css';

const FIRM_TYPE_LABELS = {
  vc: 'Venture Capital',
  angel_syndicate: 'Angel Syndicate',
  family_office: 'Family Office',
  corporate_vc: 'Corporate VC',
  accelerator: 'Accelerator'
};

export default function FirmsList({ rawData, onSelectFirm, portfolioInvestorsOnly = false }) {
  const [searchTerm, setSearchTerm] = useState('');
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
    return portfolioRounds.some(r => r.id === deal.roundId);
  });

  const enrichedFirms = firms.map(firm => {
    const investors = people.filter(p => p.firmId === firm.id);
    const firmDeals = deals.filter(d => d.firmId === firm.id);
    const activeDeals = firmDeals.filter(d =>
      ['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
    );

    const uniquePortfolioCompanies = new Set(
      firmDeals.map(deal => {
        const round = portfolioRounds.find(r => r.id === deal.roundId);
        return round ? (round.companyId || round.company_id) : null;
      }).filter(Boolean)
    );

    const totalInvestedAmount = firmDeals.reduce((sum, deal) => {
      return sum + (deal.committedAmount || 0);
    }, 0);

    const isExistingInvestor = uniquePortfolioCompanies.size > 0;
    const hasActivePipeline = activeDeals.length > 0;
    const isPortfolioRelevant = isExistingInvestor || hasActivePipeline;

    return {
      ...firm,
      investorCount: investors.length,
      portfolioCompanies: uniquePortfolioCompanies.size,
      totalInvestedAmount: totalInvestedAmount,
      activeDeals: activeDeals.length,
      isExistingInvestor,
      isPortfolioRelevant
    };
  });

  const relevantFirms = portfolioInvestorsOnly
    ? enrichedFirms.filter(f => f.isPortfolioRelevant)
    : enrichedFirms;

  const filteredFirms = relevantFirms.filter(firm =>
    searchTerm === '' ||
    firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    FIRM_TYPE_LABELS[firm.firmType]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFirms = [...filteredFirms].sort((a, b) => b.activeDeals - a.activeDeals);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="firms-list">
      <div className="firms-controls">
        <input
          type="text"
          placeholder="Search firms..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="firms-grid">
        {sortedFirms.map(firm => (
          <div
            key={firm.id}
            className={`firm-card ${firm.isExistingInvestor ? 'existing-investor' : ''}`}
            onClick={() => onSelectFirm && onSelectFirm(firm)}
          >
            <div className="firm-header">
              <div className="firm-name-section">
                <h3 className="firm-name">{firm.name}</h3>
                {firm.isExistingInvestor && (
                  <span className="existing-badge">Portfolio Investor</span>
                )}
              </div>
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
                <span className="metric-label">Partners</span>
                <span className="metric-value">{firm.investorCount}</span>
              </div>
            </div>

            <div className="firm-portfolio-summary">
              <div className="portfolio-stat-label">Portfolio Investments</div>
              <div className="firm-activity">
                <div className="activity-stat">
                  <span className="activity-value companies">{firm.portfolioCompanies}</span>
                  <span className="activity-label">Companies</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-value amount">{formatCurrency(firm.totalInvestedAmount)}</span>
                  <span className="activity-label">Invested</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-value active">{firm.activeDeals}</span>
                  <span className="activity-label">Active Deals</span>
                </div>
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
