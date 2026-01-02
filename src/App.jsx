import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(false);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return <Dashboard />;
}
