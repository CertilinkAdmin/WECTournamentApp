import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveLayout from './pages/live/LiveLayout';
import ResultsLayout from './pages/results/ResultsLayout';
import WEC2025Results from './pages/results/WEC2025Results';
import TournamentBracketResults from './pages/results/TournamentBracketResults';
import LiveBracket from './pages/live/LiveBracket';
import JudgeScorecardsResults from './pages/results/JudgeScorecardsResults';
import HeatResults from './pages/results/HeatResults';
import HeatCarouselDemo from './pages/results/HeatCarouselDemo';
import ResultsInputPage from './pages/admin/ResultsInputPage';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
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
            <Route path="results-input" element={<ResultsInputPage />} />
            <Route path="stations" element={<div>Stations</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>

          {/* Live Tournament Routes */}
          <Route path="/live" element={<LiveLayout />}>
            <Route index element={<div>Live Overview</div>} />
            <Route path="bracket" element={<LiveBracket />} />
            <Route path="heats" element={<div>Current Heats</div>} />
            <Route path="leaderboard" element={<div>Live Leaderboard</div>} />
            <Route path="stations" element={<div>Stations</div>} />
          </Route>

          {/* Results Routes */}
          <Route path="/results" element={<ResultsLayout />}>
            <Route index element={<WEC2025Results />} />
            <Route path="bracket" element={<TournamentBracketResults />} />
            <Route path="heats/:heatId" element={<HeatResults />} />
            <Route path="heat-carousel" element={<HeatCarouselDemo />} />
            <Route path="leaderboard" element={<div>Final Leaderboard</div>} />
            <Route path="champion" element={<div>Champion Results</div>} />
            <Route path="judges" element={<JudgeScorecardsResults />} />
          </Route>
        </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;