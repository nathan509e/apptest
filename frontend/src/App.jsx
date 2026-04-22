import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ScoreViewer from './components/ScoreViewer';

function App() {
  const [activeScore, setActiveScore] = useState(null);

  return (
    <div className="app-container">
      <Topbar />
      <div className="main-content-wrapper">
        <Sidebar />
        <main className="main-area">
          {activeScore ? (
            <ScoreViewer scoreFile={activeScore} onBack={() => setActiveScore(null)} />
          ) : (
            <Dashboard onScoreSelect={setActiveScore} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
