import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(false);
  const [rawData, setRawData] = useState(null);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return <Dashboard rawData={rawData} onReset={() => setRawData(null)} onDataUpdate={setRawData} />;
}
