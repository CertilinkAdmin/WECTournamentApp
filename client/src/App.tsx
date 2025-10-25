import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './pages/admin/AdminLayout.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import LiveLayout from './pages/live/LiveLayout.tsx';
import ResultsLayout from './pages/results/ResultsLayout.tsx';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page - Entry Point */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tournaments" element={<div>Tournaments</div>} />
            <Route path="competitors" element={<div>Competitors</div>} />
            <Route path="judges" element={<div>Judges</div>} />
            <Route path="stations" element={<div>Stations</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>

          {/* Live Tournament Routes */}
          <Route path="/live" element={<LiveLayout />}>
            <Route index element={<div>Live Overview</div>} />
            <Route path="bracket" element={<div>Live Bracket</div>} />
            <Route path="heats" element={<div>Current Heats</div>} />
            <Route path="leaderboard" element={<div>Live Leaderboard</div>} />
            <Route path="stations" element={<div>Stations</div>} />
          </Route>

          {/* Results Routes */}
          <Route path="/results" element={<ResultsLayout />}>
            <Route index element={<div>Results Home</div>} />
            <Route path="bracket" element={<div>Tournament Bracket</div>} />
            <Route path="heats/:heatId" element={<div>Heat Results</div>} />
            <Route path="leaderboard" element={<div>Final Leaderboard</div>} />
            <Route path="champion" element={<div>Champion Results</div>} />
            <Route path="judges" element={<div>Judge Score Cards</div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;