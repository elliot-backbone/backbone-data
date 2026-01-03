import { useState } from 'react';
import LoadData from './components/LoadData';
import AdminQA from './components/AdminQA';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [setupStep, setSetupStep] = useState('load-data');

  if (setupStep === 'load-data') {
    return <LoadData onComplete={() => setSetupStep('qa')} />;
  }

  if (setupStep === 'qa') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#f8fafc'
            }}>
              Quality Assurance
            </h2>
            <button
              onClick={() => setSetupStep('dashboard')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Continue to Dashboard
            </button>
          </div>
          <AdminQA />
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
