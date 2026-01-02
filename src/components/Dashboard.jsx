import { useState } from 'react';
import './Dashboard.css';
import PriorityQueue from './PriorityQueue';
import CompaniesList from './CompaniesList';
import CompanyDetail from './CompanyDetail';
import RoundsList from './RoundsList';
import RoundDetail from './RoundDetail';
import GoalsList from './GoalsList';
import GoalDetail from './GoalDetail';
import PortfolioOverview from './PortfolioOverview';
import FirmsList from './FirmsList';
import PeopleList from './PeopleList';
import DealsPipeline from './DealsPipeline';
import IssuesBreakdown from './IssuesBreakdown';
import ImpactView from './ImpactView';
import RelationshipsView from './RelationshipsView';

export default function Dashboard({ rawData, onReset }) {
  const [currentView, setCurrentView] = useState('priorities');
  const [selectedEntity, setSelectedEntity] = useState(null);

  const handleNavigation = (view) => {
    setCurrentView(view);
    setSelectedEntity(null);
  };

  const handleSelectEntity = (type, entity) => {
    setSelectedEntity({ type, entity });
    setCurrentView(`${type}-detail`);
  };

  const handleBackToList = () => {
    const typeMap = {
      'company-detail': 'companies',
      'round-detail': 'rounds',
      'goal-detail': 'goals'
    };
    setCurrentView(typeMap[currentView] || 'priorities');
    setSelectedEntity(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'priorities':
        return <PriorityQueue rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'companies':
        return <CompaniesList rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'company-detail':
        return <CompanyDetail company={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'rounds':
        return <RoundsList rawData={rawData} onSelectRound={(r) => handleSelectEntity('round', r)} />;
      case 'round-detail':
        return <RoundDetail round={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'goals':
        return <GoalsList rawData={rawData} onSelectGoal={(g) => handleSelectEntity('goal', g)} />;
      case 'goal-detail':
        return <GoalDetail goal={selectedEntity?.entity} rawData={rawData} onBack={handleBackToList} />;
      case 'overview':
        return <PortfolioOverview rawData={rawData} />;
      case 'firms':
        return <FirmsList rawData={rawData} onSelectFirm={(f) => handleSelectEntity('firm', f)} />;
      case 'people':
        return <PeopleList rawData={rawData} onSelectPerson={(p) => handleSelectEntity('person', p)} />;
      case 'deals':
        return <DealsPipeline rawData={rawData} />;
      case 'issues':
        return <IssuesBreakdown rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'impact':
        return <ImpactView rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
      case 'relationships':
        return <RelationshipsView rawData={rawData} />;
      default:
        return <PriorityQueue rawData={rawData} onSelectCompany={(c) => handleSelectEntity('company', c)} />;
    }
  };

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">BACKBONE</div>
        </div>
        <div className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'priorities' ? 'active' : ''}`}
            onClick={() => handleNavigation('priorities')}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Priorities</span>
          </button>
          <button
            className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavigation('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Overview</span>
          </button>
          <button
            className={`nav-item ${currentView === 'impact' ? 'active' : ''}`}
            onClick={() => handleNavigation('impact')}
          >
            <span className="nav-icon">🔄</span>
            <span className="nav-label">Impact</span>
          </button>
          <button
            className={`nav-item ${currentView === 'issues' ? 'active' : ''}`}
            onClick={() => handleNavigation('issues')}
          >
            <span className="nav-icon">⚠️</span>
            <span className="nav-label">Issues</span>
          </button>
          <button
            className={`nav-item ${currentView === 'companies' || currentView === 'company-detail' ? 'active' : ''}`}
            onClick={() => handleNavigation('companies')}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-label">Companies</span>
          </button>
          <button
            className={`nav-item ${currentView === 'rounds' || currentView === 'round-detail' ? 'active' : ''}`}
            onClick={() => handleNavigation('rounds')}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Rounds</span>
          </button>
          <button
            className={`nav-item ${currentView === 'deals' ? 'active' : ''}`}
            onClick={() => handleNavigation('deals')}
          >
            <span className="nav-icon">🤝</span>
            <span className="nav-label">Deals</span>
          </button>
          <button
            className={`nav-item ${currentView === 'goals' || currentView === 'goal-detail' ? 'active' : ''}`}
            onClick={() => handleNavigation('goals')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Goals</span>
          </button>
          <button
            className={`nav-item ${currentView === 'firms' ? 'active' : ''}`}
            onClick={() => handleNavigation('firms')}
          >
            <span className="nav-icon">🏛️</span>
            <span className="nav-label">Firms</span>
          </button>
          <button
            className={`nav-item ${currentView === 'people' ? 'active' : ''}`}
            onClick={() => handleNavigation('people')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">People</span>
          </button>
          <button
            className={`nav-item ${currentView === 'relationships' ? 'active' : ''}`}
            onClick={() => handleNavigation('relationships')}
          >
            <span className="nav-icon">🔗</span>
            <span className="nav-label">Network</span>
          </button>
        </div>
      </nav>

      <div className="dashboard-main">
        <header className="top-bar">
          <div className="top-bar-content">
            <h1 className="page-title">
              {currentView === 'priorities' && 'Priority Queue'}
              {currentView === 'overview' && 'Portfolio Overview'}
              {currentView === 'impact' && 'Impact & Ripple Effects'}
              {currentView === 'issues' && 'Issues Breakdown'}
              {currentView === 'companies' && 'Companies'}
              {currentView === 'company-detail' && selectedEntity?.entity?.name}
              {currentView === 'rounds' && 'Funding Rounds'}
              {currentView === 'round-detail' && 'Round Details'}
              {currentView === 'deals' && 'Deal Pipeline'}
              {currentView === 'goals' && 'Goals'}
              {currentView === 'goal-detail' && 'Goal Details'}
              {currentView === 'firms' && 'Firms & Investors'}
              {currentView === 'people' && 'People Directory'}
              {currentView === 'relationships' && 'Relationship Network'}
            </h1>
            <button className="top-bar-btn" onClick={onReset}>
              Reset Data
            </button>
          </div>
        </header>

        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
