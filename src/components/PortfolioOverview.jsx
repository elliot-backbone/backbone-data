import { useState, useMemo } from 'react';
import { detectIssues, calculateHealth } from '../lib/derivations';
import './PortfolioOverview.css';

export default function PortfolioOverview({ rawData, onSelectCompany }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStage, setFilterStage] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');

  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const companies = (rawData.companies || []).map(c => ({
    ...c,
    healthScore: calculateHealth(c, issues)
  }));

  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  const stages = useMemo(() => {
    const stageSet = new Set(portfolioCompanies.map(c => c.stage).filter(Boolean));
    return ['all', ...Array.from(stageSet).sort()];
  }, [portfolioCompanies]);

  const verticals = useMemo(() => {
    const verticalSet = new Set(portfolioCompanies.map(c => c.vertical).filter(Boolean));
    return ['all', ...Array.from(verticalSet).sort()];
  }, [portfolioCompanies]);

  const filteredCompanies = useMemo(() => {
    let filtered = [...portfolioCompanies];

    if (filterStage !== 'all') {
      filtered = filtered.filter(c => c.stage === filterStage);
    }

    if (filterVertical !== 'all') {
      filtered = filtered.filter(c => c.vertical === filterVertical);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [portfolioCompanies, sortField, sortDirection, filterStage, filterVertical]);

  const totalArr = portfolioCompanies.reduce((sum, c) => sum + (c.arr || 0), 0);
  const avgGrowthRate = portfolioCompanies.length > 0
    ? portfolioCompanies.reduce((sum, c) => sum + (c.revenueGrowthRate || 0), 0) / portfolioCompanies.length
    : 0;
  const totalRaised = portfolioCompanies.reduce((sum, c) => sum + (c.totalRaised || 0), 0);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Warning';
    return 'Critical';
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value) => {
    if (value == null) return '-';
    return `${(value * 100).toFixed(0)}%`;
  };

  return (
    <div className="portfolio-overview">
      <div className="overview-header">
        <div className="header-stats">
          <div className="header-stat">
            <div className="stat-value">{portfolioCompanies.length}</div>
            <div className="stat-label">Portfolio Companies</div>
          </div>
          <div className="header-stat">
            <div className="stat-value">${(totalArr / 1000000).toFixed(1)}M</div>
            <div className="stat-label">Total ARR</div>
          </div>
          <div className="header-stat">
            <div className="stat-value">{formatPercent(avgGrowthRate)}</div>
            <div className="stat-label">Avg Growth</div>
          </div>
          <div className="header-stat">
            <div className="stat-value">${(totalRaised / 1000000).toFixed(0)}M</div>
            <div className="stat-label">Total Raised</div>
          </div>
        </div>

        <div className="overview-filters">
          <div className="filter-group">
            <label className="filter-label">Stage</label>
            <select
              className="filter-select"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
            >
              {stages.map(stage => (
                <option key={stage} value={stage}>
                  {stage === 'all' ? 'All Stages' : stage}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Vertical</label>
            <select
              className="filter-select"
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value)}
            >
              {verticals.map(vertical => (
                <option key={vertical} value={vertical}>
                  {vertical === 'all' ? 'All Verticals' : vertical}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-count">
            Showing {filteredCompanies.length} of {portfolioCompanies.length}
          </div>
        </div>
      </div>

      <div className="companies-table">
        <div className="table-header">
          <div className="table-header-cell col-company" onClick={() => handleSort('name')}>
            Company {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-stage" onClick={() => handleSort('stage')}>
            Stage {sortField === 'stage' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-vertical" onClick={() => handleSort('vertical')}>
            Vertical {sortField === 'vertical' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-health" onClick={() => handleSort('healthScore')}>
            Health {sortField === 'healthScore' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-arr" onClick={() => handleSort('arr')}>
            ARR {sortField === 'arr' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-growth" onClick={() => handleSort('revenueGrowthRate')}>
            Growth {sortField === 'revenueGrowthRate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-runway" onClick={() => handleSort('runway')}>
            Runway {sortField === 'runway' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-header-cell col-raised" onClick={() => handleSort('totalRaised')}>
            Raised {sortField === 'totalRaised' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        </div>

        <div className="table-body">
          {filteredCompanies.map(company => (
            <div
              key={company.id}
              className="table-row"
              onClick={() => onSelectCompany && onSelectCompany(company)}
            >
              <div className="table-cell col-company">
                <div className="company-name">{company.name}</div>
                {company.founded && (
                  <div className="company-meta">Founded {company.founded}</div>
                )}
              </div>
              <div className="table-cell col-stage">
                <span className="stage-badge">{company.stage || '-'}</span>
              </div>
              <div className="table-cell col-vertical">
                {company.vertical || '-'}
              </div>
              <div className="table-cell col-health">
                <div className="health-indicator">
                  <div
                    className="health-score"
                    style={{ color: getHealthColor(company.healthScore) }}
                  >
                    {company.healthScore}
                  </div>
                  <div className="health-label">
                    {getHealthLabel(company.healthScore)}
                  </div>
                </div>
              </div>
              <div className="table-cell col-arr">
                {formatCurrency(company.arr)}
              </div>
              <div className="table-cell col-growth">
                <span style={{
                  color: company.revenueGrowthRate >= 0.3 ? '#10b981' :
                         company.revenueGrowthRate >= 0.1 ? '#3b82f6' :
                         '#94a3b8'
                }}>
                  {formatPercent(company.revenueGrowthRate)}
                </span>
              </div>
              <div className="table-cell col-runway">
                <span style={{
                  color: company.runway < 6 ? '#ef4444' :
                         company.runway < 12 ? '#f59e0b' :
                         '#94a3b8'
                }}>
                  {company.runway ? `${company.runway}mo` : '-'}
                </span>
              </div>
              <div className="table-cell col-raised">
                {formatCurrency(company.totalRaised)}
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="table-empty">
            No companies match the selected filters
          </div>
        )}
      </div>
    </div>
  );
}
