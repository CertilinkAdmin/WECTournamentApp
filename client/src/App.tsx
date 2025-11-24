import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import LandingPage from './pages/LandingPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveLayout from './pages/live/LiveLayout';
import TournamentList from './pages/live/TournamentList';
import Championships from './pages/championships/Championships';
import ResultsLayout from './pages/results/ResultsLayout';
import ResultsTournamentList from './pages/results/ResultsTournamentList';
import WEC2025Results from './pages/results/WEC2025Results';
import TournamentBracketResults from './pages/results/TournamentBracketResults';
import LiveBracket from './pages/live/LiveBracket';
import LiveOverview from './pages/live/LiveOverview';
import LiveHeats from './pages/live/LiveHeats';
import LiveLeaderboard from './pages/live/LiveLeaderboard';
import StationsManagement from './components/StationsManagement';
import JudgeScorecardsResults from './pages/results/JudgeScorecardsResults';
import JudgeScorecardsDetail from './pages/results/JudgeScorecardsDetail';
import Baristas from './pages/results/Baristas';
import BaristaDetail from './pages/results/BaristaDetail';
import Judges from './pages/results/Judges';
import HeatResults from './pages/results/HeatResults';
import HeatCarouselDemo from './pages/results/HeatCarouselDemo';
import ResultsInputPage from './pages/admin/ResultsInputPage';
import BracketBuilder from './pages/admin/BracketBuilder';
import AdminTournaments from './pages/admin/AdminTournaments';
import CreateTournament from './pages/admin/CreateTournament';
import ManageBaristas from './pages/admin/ManageBaristas';
import ManageJudges from './pages/admin/ManageJudges';
import BottomNav from './components/BottomNav';
import './App.css';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
        <div className="App">
          <BottomNav />
          <Routes>
          {/* Landing Page - Entry Point */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tournaments" element={<AdminTournaments />} />
            <Route path="tournaments/create" element={<CreateTournament />} />
            <Route path="competitors" element={<ManageBaristas />} />
            <Route path="judges" element={<ManageJudges />} />
            <Route path="results-input" element={<ResultsInputPage />} />
            <Route path="bracket-builder" element={<BracketBuilder />} />
            <Route path="stations" element={<div>Stations</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>

          {/* Live Tournament Routes */}
          <Route path="/live" element={<TournamentList />} />
          <Route path="/live/:tournamentId" element={<LiveLayout />}>
            <Route index element={<LiveOverview />} />
            <Route path="overview" element={<LiveOverview />} />
            <Route path="bracket" element={<LiveBracket />} />
            <Route path="heats" element={<LiveHeats />} />
            <Route path="leaderboard" element={<LiveLeaderboard />} />
            <Route path="stations" element={<StationsManagement />} />
          </Route>

          {/* Results Routes */}
          <Route path="/results" element={<ResultsTournamentList />} />
          <Route path="/results/:tournamentSlug" element={<ResultsLayout />}>
            <Route index element={<WEC2025Results />} />
            <Route path="bracket" element={<TournamentBracketResults />} />
            <Route path="heats/:heatId" element={<HeatResults />} />
            <Route path="heat-carousel" element={<HeatCarouselDemo />} />
            <Route path="leaderboard" element={<div>Final Leaderboard</div>} />
            <Route path="baristas" element={<Baristas />} />
            <Route path="baristas/:baristaName" element={<BaristaDetail />} />
            <Route path="judges" element={<Judges />} />
            <Route path="judges/:judgeName" element={<JudgeScorecardsDetail />} />
            <Route path="scorecards" element={<JudgeScorecardsResults />} />
            <Route path="scorecards/:judgeName" element={<JudgeScorecardsDetail />} />
          </Route>
        </Routes>
        </div>
      </Router>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;