import { useState, useMemo } from 'react';
import { detectIssues, calculateHealth } from '../lib/derivations';
import './PortfolioOverview.css';

export default function PortfolioOverview({ rawData, onSelectCompany }) {
  const [viewMode, setViewMode] = useState('health');
  const [filterStage, setFilterStage] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');

  const issues = detectIssues(rawData.companies || [], rawData.rounds || [], rawData.goals || [], []);
  const companies = (rawData.companies || []).map(c => {
    const healthScore = calculateHealth(c, issues);
    const companyIssues = issues.filter(i => i.companyId === c.id);
    const maxUrgency = companyIssues.length > 0
      ? Math.max(...companyIssues.map(i => i.urgencyScore || 0))
      : 0;

    return {
      ...c,
      healthScore,
      priorityScore: maxUrgency,
      issueCount: companyIssues.length
    };
  });

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

    if (viewMode === 'health') {
      filtered.sort((a, b) => a.healthScore - b.healthScore);
    } else {
      filtered.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    return filtered;
  }, [portfolioCompanies, viewMode, filterStage, filterVertical]);

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getPriorityColor = (score) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#3b82f6';
    return '#10b981';
  };

  const getCardColor = (company) => {
    if (viewMode === 'health') {
      return getHealthColor(company.healthScore);
    } else {
      return getPriorityColor(company.priorityScore);
    }
  };

  const getCardLabel = (company) => {
    if (viewMode === 'health') {
      return company.healthScore;
    } else {
      return company.issueCount > 0 ? `${company.issueCount}` : '0';
    }
  };

  return (
    <div className="portfolio-overview">
      <div className="overview-controls">
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'health' ? 'active' : ''}`}
            onClick={() => setViewMode('health')}
          >
            Health
          </button>
          <button
            className={`view-tab ${viewMode === 'priority' ? 'active' : ''}`}
            onClick={() => setViewMode('priority')}
          >
            Priorities
          </button>
        </div>

        <div className="overview-filters">
          <div className="filter-group">
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
        </div>
      </div>

      <div className="companies-grid">
        {filteredCompanies.map(company => (
          <div
            key={company.id}
            className="company-card"
            style={{
              background: getCardColor(company),
              borderColor: getCardColor(company)
            }}
            onClick={() => onSelectCompany && onSelectCompany(company)}
          >
            <div className="company-card-name">{company.name}</div>
            <div className="company-card-score">
              {getCardLabel(company)}
            </div>
            {viewMode === 'priority' && company.issueCount > 0 && (
              <div className="company-card-issues">
                {company.issueCount} issue{company.issueCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="empty-state">
          No companies match the selected filters
        </div>
      )}
    </div>
  );
}
