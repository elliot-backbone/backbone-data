import { useState, useEffect } from 'react';
import { getResolvedPriorities, loadAllData } from '../lib/supabase';
import './Dashboard.css';
import PriorityQueue from './PriorityQueue';
import PriorityDetail from './PriorityDetail';
import PortfolioOverview from './PortfolioOverview';
import IssuesBreakdown from './IssuesBreakdown';
import ImpactView from './ImpactView';
import CompaniesList from './CompaniesList';
import PipelineCompaniesList from './PipelineCompaniesList';
import CompanyDetail from './CompanyDetail';
import GoalsList from './GoalsList';
import GoalDetail from './GoalDetail';
import RoundsList from './RoundsList';
import RoundDetail from './RoundDetail';
import DealsPipeline from './DealsPipeline';
import DealDetail from './DealDetail';
import FirmsList from './FirmsList';
import FirmDetail from './FirmDetail';
import PeopleList from './PeopleList';
import PersonDetail from './PersonDetail';
import RelationshipsView from './RelationshipsView';
import RelationshipDetail from './RelationshipDetail';
import Admin from './Admin';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('priorities');
  const [topNavView, setTopNavView] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [resolvedPriorities, setResolvedPriorities] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, resolved] = await Promise.all([
        loadAllData(),
        getResolvedPriorities()
      ]);
      setRawData(data);
      setResolvedPriorities(resolved);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResolvedPriorities = async () => {
    try {
      const resolved = await getResolvedPriorities();
      setResolvedPriorities(resolved);
    } catch (error) {
      console.error('Failed to load resolved priorities:', error);
    }
  };

  const handlePriorityResolved = () => {
    loadResolvedPriorities();
  };

  const handleDataUpdate = async () => {
    await loadData();
  };

  const handleNavigation = (view, newTopNav = null) => {
    setCurrentView(view);
    setSelectedEntity(null);
    setNavigationHistory([]);
    if (newTopNav !== null) {
      setTopNavView(newTopNav);
    }
  };

  const handleSelectEntity = (type, entity) => {
    setNavigationHistory(prev => [...prev, { view: currentView, entity: selectedEntity }]);
    setSelectedEntity({ type, entity });
    setCurrentView(`${type}-detail`);
  };

  const handleBackToList = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentView(previous.view);
      setSelectedEntity(previous.entity);
    } else {
      const typeMap = {
        'priority-detail': 'priorities',
        'company-detail': topNavView === 'pipeline' ? 'pipeline-companies' : 'companies-list',
        'round-detail': topNavView === 'pipeline' ? 'pipeline-rounds' : (topNavView === 'firms' ? 'all-firms-rounds' : 'portfolio-firm-rounds'),
        'goal-detail': 'goals',
        'deal-detail': topNavView === 'pipeline' ? 'pipeline-deals' : (topNavView === 'firms' ? 'all-firms-deals' : 'portfolio-firm-deals'),
        'firm-detail': topNavView === 'firms' ? 'all-firms' : 'portfolio-firms',
        'person-detail': topNavView === 'firms' ? 'all-firms-partners' : 'portfolio-partners',
        'relationship-detail': 'relationships'
      };
      setCurrentView(typeMap[currentView] || 'priorities');
      setSelectedEntity(null);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'priorities':
        return <PriorityQueue rawData={rawData} resolvedPriorities={resolvedPriorities} onSelectIssue={(i) => handleSelectEntity('priority', i)} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'priority-detail':
        return <PriorityDetail issue={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectIssue={(i) => handleSelectEntity('priority', i)} onSelectGoal={(g) => handleSelectEntity('goal', g)} onResolved={handlePriorityResolved} onDataUpdate={handleDataUpdate} />;
      case 'portfolio-overview':
        return <PortfolioOverview rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'companies-list':
        return <CompaniesList rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'pipeline-companies':
        return <PipelineCompaniesList rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'company-detail':
        return <CompanyDetail company={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectRound={(r) => handleSelectEntity('round', r)} onSelectGoal={(g) => handleSelectEntity('goal', g)} />;
      case 'goals':
        return <GoalsList rawData={rawData} onSelectGoal={(g) => handleSelectEntity('goal', g)} />;
      case 'goal-detail':
        return <GoalDetail goal={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'portfolio-rounds':
      case 'pipeline-rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} pipelineOnly={currentView === 'pipeline-rounds'} />;
      case 'round-detail':
        return <RoundDetail round={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectPerson={(p) => handleSelectEntity('person', p)} />;
      case 'portfolio-deals':
      case 'pipeline-deals':
      case 'all-firms-deals':
        return <DealsPipeline rawData={rawData} onSelectDeal={(d) => handleSelectEntity('deal', d)} pipelineOnly={currentView === 'pipeline-deals'} showAllFirms={currentView === 'all-firms-deals'} />;
      case 'deal-detail':
        return <DealDetail deal={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectPerson={(p) => handleSelectEntity('person', p)} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'portfolio-firms':
        return <FirmsList rawData={rawData} onSelectFirm={(f) => handleSelectEntity('firm', f)} portfolioInvestorsOnly={true} />;
      case 'all-firms':
        return <FirmsList rawData={rawData} onSelectFirm={(f) => handleSelectEntity('firm', f)} portfolioInvestorsOnly={false} />;
      case 'firm-detail':
        return <FirmDetail firm={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectPerson={(p) => handleSelectEntity('person', p)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'portfolio-partners':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} filterToInvestors={true} showAllFirms={false} />;
      case 'all-firms-partners':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} filterToInvestors={true} showAllFirms={true} />;
      case 'portfolio-firm-deals':
        return <DealsPipeline rawData={rawData} onSelectDeal={(d) => handleSelectEntity('deal', d)} pipelineOnly={false} showAllFirms={false} />;
      case 'portfolio-firm-rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} showAllFirms={false} />;
      case 'all-firms-rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} showAllFirms={true} />;
      case 'person-detail':
        return <PersonDetail person={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'relationships':
        return <RelationshipsView rawData={rawData} onSelectRelationship={(r) => handleSelectEntity('relationship', r)} />;
      case 'directory':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} simpleSearch={true} />;
      case 'relationship-detail':
        return <RelationshipDetail relationship={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'admin-data':
        return <Admin onClose={() => handleNavigation('priorities', null)} initialTab="import-export" />;
      case 'admin-qa':
        return <Admin onClose={() => handleNavigation('priorities', null)} initialTab="qa" />;
      case 'admin-analyze':
        return <Admin onClose={() => handleNavigation('priorities', null)} initialTab="analyze" />;
      default:
        return <PriorityQueue rawData={rawData} onSelectIssue={(i) => handleSelectEntity('priority', i)} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!rawData) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <h2>No Data Available</h2>
          <p>Use Admin → Import/Export to load your data</p>
          <button onClick={() => handleNavigation('admin-data', null)} className="primary-btn">
            Open Import/Export
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src="/src/assets/backbone_white.svg" alt="Backbone" className="sidebar-logo" />
        </div>
        <div className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'priorities' || currentView === 'priority-detail' ? 'active' : ''}`}
            onClick={() => handleNavigation('priorities', null)}
          >
            <span className="nav-label">Priorities</span>
          </button>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'portfolio-overview' || currentView === 'companies-list' || currentView === 'company-detail' || currentView === 'goals' || currentView === 'goal-detail' || currentView === 'portfolio-rounds' || currentView === 'round-detail' || currentView === 'portfolio-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-overview', null)}
            >
              Portfolio
            </button>
            <button
              className={`nav-item sub ${currentView === 'companies-list' || currentView === 'company-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('companies-list', null)}
            >
              <span className="nav-label">Companies</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'goals' || currentView === 'goal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('goals', null)}
            >
              <span className="nav-label">Goals</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'portfolio-rounds' || currentView === 'round-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-rounds', null)}
            >
              <span className="nav-label">Rounds</span>
            </button>
            <button
              className={`nav-item sub-sub ${currentView === 'portfolio-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-deals', null)}
            >
              <span className="nav-label">Deals</span>
            </button>
          </div>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'portfolio-firms' || currentView === 'firm-detail' || currentView === 'portfolio-partners' || currentView === 'portfolio-firm-deals' || currentView === 'portfolio-firm-rounds' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-firms', null)}
            >
              Firms
            </button>
            <button
              className={`nav-item sub ${currentView === 'portfolio-partners' || currentView === 'person-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-partners', null)}
            >
              <span className="nav-label">Partners</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'portfolio-firm-deals' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-firm-deals', null)}
            >
              <span className="nav-label">Deals</span>
            </button>
            <button
              className={`nav-item sub-sub ${currentView === 'portfolio-firm-rounds' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-firm-rounds', null)}
            >
              <span className="nav-label">Rounds</span>
            </button>
          </div>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'relationships' || currentView === 'relationship-detail' || currentView === 'directory' ? 'active' : ''}`}
              onClick={() => handleNavigation('relationships', null)}
            >
              Network
            </button>
            <button
              className={`nav-item sub ${currentView === 'directory' ? 'active' : ''}`}
              onClick={() => handleNavigation('directory', null)}
            >
              <span className="nav-label">Directory</span>
            </button>
          </div>

          <div className="nav-section admin-section">
            <div className="nav-section-label">Admin</div>
            <button
              className={`nav-item sub ${currentView === 'admin-data' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-data', null)}
            >
              <span className="nav-label">Data</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'admin-qa' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-qa', null)}
            >
              <span className="nav-label">QA</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'admin-analyze' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-analyze', null)}
            >
              <span className="nav-label">Analyze</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-main">
        <div className="horizontal-nav">
          <div className="horizontal-nav-section">
            <button
              className={`horizontal-nav-section-label clickable ${topNavView === 'pipeline' ? 'active' : ''}`}
              onClick={() => {
                setTopNavView('pipeline');
                handleNavigation('pipeline-companies', 'pipeline');
              }}
            >
              PIPELINE
            </button>
            {topNavView === 'pipeline' && (
              <div className="horizontal-nav-submenu">
                <button
                  className={`horizontal-nav-subitem ${currentView === 'pipeline-companies' || currentView === 'company-detail' ? 'active' : ''}`}
                  onClick={() => handleNavigation('pipeline-companies', 'pipeline')}
                >
                  Companies
                </button>
                <button
                  className={`horizontal-nav-subitem ${currentView === 'pipeline-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
                  onClick={() => handleNavigation('pipeline-deals', 'pipeline')}
                >
                  Deals
                </button>
                <button
                  className={`horizontal-nav-subitem ${currentView === 'pipeline-rounds' || currentView === 'round-detail' ? 'active' : ''}`}
                  onClick={() => handleNavigation('pipeline-rounds', 'pipeline')}
                >
                  Rounds
                </button>
              </div>
            )}
          </div>

          <div className="horizontal-nav-section">
            <button
              className={`horizontal-nav-section-label clickable ${topNavView === 'firms' ? 'active' : ''}`}
              onClick={() => {
                setTopNavView('firms');
                handleNavigation('all-firms', 'firms');
              }}
            >
              FIRMS
            </button>
            {topNavView === 'firms' && (
              <div className="horizontal-nav-submenu">
                <button
                  className={`horizontal-nav-subitem ${currentView === 'all-firms' || currentView === 'firm-detail' ? 'active' : ''}`}
                  onClick={() => handleNavigation('all-firms', 'firms')}
                >
                  Firms
                </button>
                <button
                  className={`horizontal-nav-subitem ${currentView === 'all-firms-partners' || currentView === 'person-detail' ? 'active' : ''}`}
                  onClick={() => handleNavigation('all-firms-partners', 'firms')}
                >
                  Partners
                </button>
                <button
                  className={`horizontal-nav-subitem ${currentView === 'all-firms-deals' ? 'active' : ''}`}
                  onClick={() => handleNavigation('all-firms-deals', 'firms')}
                >
                  Deals
                </button>
                <button
                  className={`horizontal-nav-subitem ${currentView === 'all-firms-rounds' ? 'active' : ''}`}
                  onClick={() => handleNavigation('all-firms-rounds', 'firms')}
                >
                  Rounds
                </button>
              </div>
            )}
          </div>

          <div className="horizontal-nav-section">
            <button
              className={`horizontal-nav-section-label clickable ${topNavView === 'people' ? 'active' : ''}`}
              onClick={() => {
                setTopNavView('people');
                handleNavigation('directory', 'people');
              }}
            >
              PEOPLE
            </button>
            {topNavView === 'people' && (
              <div className="horizontal-nav-submenu">
                <button
                  className={`horizontal-nav-subitem ${currentView === 'directory' ? 'active' : ''}`}
                  onClick={() => handleNavigation('directory', 'people')}
                >
                  Directory
                </button>
              </div>
            )}
          </div>
        </div>

        <header className="top-bar">
          <div className="top-bar-content">
            <h1 className="page-title">
              {currentView === 'priorities' && 'Priority Queue'}
              {currentView === 'priority-detail' && 'Priority Detail'}
              {currentView === 'companies' && 'Portfolio Overview'}
              {currentView === 'pipeline-companies' && 'Pipeline Companies'}
              {currentView === 'company-detail' && selectedEntity?.entity?.name}
              {currentView === 'goals' && 'Goals'}
              {currentView === 'goal-detail' && 'Goal Details'}
              {currentView === 'portfolio-rounds' && 'Portfolio Rounds'}
              {currentView === 'pipeline-rounds' && 'Pipeline Rounds'}
              {currentView === 'round-detail' && 'Round Details'}
              {currentView === 'portfolio-deals' && 'Portfolio Deals'}
              {currentView === 'pipeline-deals' && 'Pipeline Deals'}
              {currentView === 'deal-detail' && 'Deal Details'}
              {currentView === 'portfolio-firms' && 'Portfolio Firms'}
              {currentView === 'all-firms' && 'All Firms'}
              {currentView === 'firm-detail' && selectedEntity?.entity?.name}
              {currentView === 'portfolio-partners' && 'Portfolio Partners'}
              {currentView === 'all-firms-partners' && 'All Partners'}
              {currentView === 'person-detail' && selectedEntity?.entity?.name}
              {currentView === 'portfolio-firm-deals' && 'Portfolio Firm Deals'}
              {currentView === 'all-firms-deals' && 'All Firm Deals'}
              {currentView === 'portfolio-firm-rounds' && 'Portfolio Firm Rounds'}
              {currentView === 'all-firms-rounds' && 'All Firm Rounds'}
              {currentView === 'relationships' && 'Network Overview'}
              {currentView === 'directory' && 'Directory'}
              {currentView === 'relationship-detail' && 'Relationship Details'}
              {currentView === 'admin-data' && 'Data Management'}
              {currentView === 'admin-qa' && 'Quality Assurance'}
              {currentView === 'admin-analyze' && 'System Analysis'}
            </h1>
            {topNavView && (
              <div className="breadcrumb-nav">
                {topNavView === 'pipeline' && (
                  <>
                    <button
                      className={`breadcrumb-item ${currentView === 'pipeline-companies' || currentView === 'company-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('pipeline-companies', 'pipeline')}
                    >
                      Companies
                    </button>
                    <button
                      className={`breadcrumb-item ${currentView === 'pipeline-rounds' || currentView === 'round-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('pipeline-rounds', 'pipeline')}
                    >
                      Rounds
                    </button>
                    <button
                      className={`breadcrumb-item ${currentView === 'pipeline-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('pipeline-deals', 'pipeline')}
                    >
                      Deals
                    </button>
                  </>
                )}
                {topNavView === 'firms' && (
                  <>
                    <button
                      className={`breadcrumb-item ${currentView === 'all-firms' || currentView === 'firm-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('all-firms', 'firms')}
                    >
                      Firms
                    </button>
                    <button
                      className={`breadcrumb-item ${currentView === 'all-firms-partners' || currentView === 'person-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('all-firms-partners', 'firms')}
                    >
                      Partners
                    </button>
                    <button
                      className={`breadcrumb-item ${currentView === 'all-firms-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('all-firms-deals', 'firms')}
                    >
                      Deals
                    </button>
                    <button
                      className={`breadcrumb-item ${currentView === 'all-firms-rounds' || currentView === 'round-detail' ? 'active' : ''}`}
                      onClick={() => handleNavigation('all-firms-rounds', 'firms')}
                    >
                      Rounds
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
