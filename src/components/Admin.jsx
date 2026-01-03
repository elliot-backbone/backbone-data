import { useState } from 'react';
import AdminImportExport from './AdminImportExport';
import AdminGenerate from './AdminGenerate';
import AdminQA from './AdminQA';
import AdminAnalyze from './AdminAnalyze';
import './Admin.css';

export default function Admin({ onClose, initialTab = 'import-export' }) {
  const [activeView, setActiveView] = useState(initialTab);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="admin-nav">
        <button
          className={`admin-nav-btn ${activeView === 'import-export' ? 'active' : ''}`}
          onClick={() => setActiveView('import-export')}
        >
          Import/Export
        </button>
        <button
          className={`admin-nav-btn ${activeView === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveView('generate')}
        >
          Generate
        </button>
        <button
          className={`admin-nav-btn ${activeView === 'qa' ? 'active' : ''}`}
          onClick={() => setActiveView('qa')}
        >
          QA
        </button>
        <button
          className={`admin-nav-btn ${activeView === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveView('analyze')}
        >
          Analyze
        </button>
      </div>

      <div className="admin-main">
        {activeView === 'import-export' && <AdminImportExport />}
        {activeView === 'generate' && <AdminGenerate />}
        {activeView === 'qa' && <AdminQA />}
        {activeView === 'analyze' && <AdminAnalyze />}
      </div>
    </div>
  );
}
