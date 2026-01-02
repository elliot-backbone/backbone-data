import { useState } from 'react';
import LandingPage from './components/LandingPage';
import DataImport from './components/DataImport';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(false);
  const [rawData, setRawData] = useState(null);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!rawData) {
    return <DataImport onDataLoaded={setRawData} />;
  }

  return <Dashboard rawData={rawData} onReset={() => setRawData(null)} onDataUpdate={setRawData} />;
}
