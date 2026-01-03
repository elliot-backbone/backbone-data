import { useState, useEffect } from 'react';
import { getResolvedPriorities, loadAllData } from '../lib/supabase';
import './Dashboard.css';
import PriorityQueue from './PriorityQueue';
import PriorityDetail from './PriorityDetail';
import Snapshot from './Snapshot';
import IssuesBreakdown from './IssuesBreakdown';
import ImpactView from './ImpactView';
import CompaniesList from './CompaniesList';
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

  const handleNavigation = (view) => {
    setCurrentView(view);
    setSelectedEntity(null);
    setNavigationHistory([]);
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
        'company-detail': 'companies',
        'round-detail': 'portfolio-rounds',
        'goal-detail': 'goals',
        'deal-detail': 'portfolio-deals',
        'firm-detail': 'firms',
        'person-detail': 'directory',
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
      case 'companies':
        return <Snapshot rawData={rawData} resolvedPriorities={resolvedPriorities} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'company-detail':
        return <CompanyDetail company={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectRound={(r) => handleSelectEntity('round', r)} onSelectGoal={(g) => handleSelectEntity('goal', g)} />;
      case 'goals':
        return <GoalsList rawData={rawData} onSelectGoal={(g) => handleSelectEntity('goal', g)} />;
      case 'goal-detail':
        return <GoalDetail goal={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'portfolio-rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'round-detail':
        return <RoundDetail round={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectPerson={(p) => handleSelectEntity('person', p)} />;
      case 'portfolio-deals':
        return <DealsPipeline rawData={rawData} onSelectDeal={(d) => handleSelectEntity('deal', d)} />;
      case 'deal-detail':
        return <DealDetail deal={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectPerson={(p) => handleSelectEntity('person', p)} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'firms':
        return <FirmsList rawData={rawData} onSelectFirm={(f) => handleSelectEntity('firm', f)} />;
      case 'firm-detail':
        return <FirmDetail firm={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectPerson={(p) => handleSelectEntity('person', p)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'partners':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} filterToInvestors={true} />;
      case 'firm-deals':
        return <DealsPipeline rawData={rawData} onSelectDeal={(d) => handleSelectEntity('deal', d)} groupByFirm={true} />;
      case 'firm-rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} firmPerspective={true} />;
      case 'person-detail':
        return <PersonDetail person={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} onSelectFirm={(f) => handleSelectEntity('firm', f)} onSelectDeal={(d) => handleSelectEntity('deal', d)} onSelectCompany={(c) => handleSelectEntity('company', c)} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'relationships':
        return <RelationshipsView rawData={rawData} onSelectRelationship={(r) => handleSelectEntity('relationship', r)} />;
      case 'directory':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} simpleSearch={true} />;
      case 'relationship-detail':
        return <RelationshipDetail relationship={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'admin-data':
        return <Admin onClose={() => handleNavigation('priorities')} initialTab="import-export" />;
      case 'admin-qa':
        return <Admin onClose={() => handleNavigation('priorities')} initialTab="qa" />;
      case 'admin-analyze':
        return <Admin onClose={() => handleNavigation('priorities')} initialTab="analyze" />;
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
          <button onClick={() => handleNavigation('admin-data')} className="primary-btn">
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
            onClick={() => handleNavigation('priorities')}
          >
            <span className="nav-label">Priorities</span>
          </button>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'companies' || currentView === 'company-detail' || currentView === 'goals' || currentView === 'goal-detail' || currentView === 'portfolio-rounds' || currentView === 'round-detail' || currentView === 'portfolio-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('companies')}
            >
              Portfolio
            </button>
            <button
              className={`nav-item sub ${currentView === 'companies' || currentView === 'company-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('companies')}
            >
              <span className="nav-label">Companies</span>
            </button>
            <button
              className={`nav-item sub-sub ${currentView === 'goals' || currentView === 'goal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('goals')}
            >
              <span className="nav-label">Goals</span>
            </button>
            <button
              className={`nav-item sub-sub ${currentView === 'portfolio-rounds' || currentView === 'round-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-rounds')}
            >
              <span className="nav-label">Rounds</span>
            </button>
            <button
              className={`nav-item sub-sub-sub ${currentView === 'portfolio-deals' || currentView === 'deal-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('portfolio-deals')}
            >
              <span className="nav-label">Deals</span>
            </button>
          </div>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'firms' || currentView === 'firm-detail' || currentView === 'partners' || currentView === 'person-detail' || currentView === 'firm-deals' || currentView === 'firm-rounds' ? 'active' : ''}`}
              onClick={() => handleNavigation('firms')}
            >
              Firms
            </button>
            <button
              className={`nav-item sub ${currentView === 'partners' || currentView === 'person-detail' ? 'active' : ''}`}
              onClick={() => handleNavigation('partners')}
            >
              <span className="nav-label">Partners</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'firm-deals' ? 'active' : ''}`}
              onClick={() => handleNavigation('firm-deals')}
            >
              <span className="nav-label">Deals</span>
            </button>
            <button
              className={`nav-item sub-sub ${currentView === 'firm-rounds' ? 'active' : ''}`}
              onClick={() => handleNavigation('firm-rounds')}
            >
              <span className="nav-label">Rounds</span>
            </button>
          </div>

          <div className="nav-section">
            <button
              className={`nav-section-label clickable ${currentView === 'relationships' || currentView === 'relationship-detail' || currentView === 'directory' ? 'active' : ''}`}
              onClick={() => handleNavigation('relationships')}
            >
              Network
            </button>
            <button
              className={`nav-item sub ${currentView === 'directory' ? 'active' : ''}`}
              onClick={() => handleNavigation('directory')}
            >
              <span className="nav-label">Directory</span>
            </button>
          </div>

          <div className="nav-section admin-section">
            <div className="nav-section-label">Admin</div>
            <button
              className={`nav-item sub ${currentView === 'admin-data' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-data')}
            >
              <span className="nav-label">Data</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'admin-qa' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-qa')}
            >
              <span className="nav-label">QA</span>
            </button>
            <button
              className={`nav-item sub ${currentView === 'admin-analyze' ? 'active' : ''}`}
              onClick={() => handleNavigation('admin-analyze')}
            >
              <span className="nav-label">Analyze</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-main">
        <header className="top-bar">
          <div className="top-bar-content">
            <h1 className="page-title">
              {currentView === 'priorities' && 'Priority Queue'}
              {currentView === 'priority-detail' && 'Priority Detail'}
              {currentView === 'companies' && 'Portfolio Overview'}
              {currentView === 'company-detail' && selectedEntity?.entity?.name}
              {currentView === 'goals' && 'Goals'}
              {currentView === 'goal-detail' && 'Goal Details'}
              {currentView === 'portfolio-rounds' && 'Funding Rounds'}
              {currentView === 'round-detail' && 'Round Details'}
              {currentView === 'portfolio-deals' && 'Portfolio Deals'}
              {currentView === 'deal-detail' && 'Deal Details'}
              {currentView === 'firms' && 'Investor Relationships'}
              {currentView === 'firm-detail' && selectedEntity?.entity?.name}
              {currentView === 'partners' && 'Partners'}
              {currentView === 'person-detail' && selectedEntity?.entity?.name}
              {currentView === 'firm-deals' && 'Deals by Firm'}
              {currentView === 'firm-rounds' && 'Rounds by Firm'}
              {currentView === 'relationships' && 'Network Overview'}
              {currentView === 'directory' && 'Directory'}
              {currentView === 'relationship-detail' && 'Relationship Details'}
              {currentView === 'admin-data' && 'Data Management'}
              {currentView === 'admin-qa' && 'Quality Assurance'}
              {currentView === 'admin-analyze' && 'System Analysis'}
            </h1>
          </div>
        </header>

        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
