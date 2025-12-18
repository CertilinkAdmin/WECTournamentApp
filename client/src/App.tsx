import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import LiveJudgesScoring from './pages/live/LiveJudgesScoring';
import StationsManagement from './components/StationsManagement';
import StationLeadView from './components/StationLeadView';
import StationDetail from './pages/StationDetail';
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
import JudgeScoringView from './components/JudgeScoringView';
import AdminCupPositionAssignmentPage from './pages/admin/AdminCupPositionAssignmentPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BottomNav from './components/BottomNav';
import { Toaster } from './components/ui/toaster';
import './App.css';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
        <div className="App">
          <Toaster />
          <BottomNav />
          <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Landing Page - Entry Point */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tournaments" element={<AdminTournaments />} />
            <Route path="tournaments/create" element={<CreateTournament />} />
            <Route path="competitors" element={<ManageBaristas />} />
            <Route path="judges" element={<ManageJudges />} />
            <Route path="judges/scoring/:tournamentId" element={<JudgeScoringView />} />
            <Route path="cup-positions/:matchId" element={<AdminCupPositionAssignmentPage />} />
            <Route path="results-input" element={<ResultsInputPage />} />
            <Route path="bracket-builder" element={<BracketBuilder />} />
            <Route path="stations" element={<div>Stations</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>

          {/* Live Tournament Routes */}
          <Route path="/live" element={<TournamentList />} />
          <Route path="/live/:tournamentId" element={<LiveLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<LiveOverview />} />
            <Route path="bracket" element={<LiveBracket />} />
            <Route path="heats" element={<LiveHeats />} />
            <Route path="leaderboard" element={<LiveLeaderboard />} />
            <Route path="stations" element={<StationsManagement />} />
            <Route path="judges-scoring" element={<LiveJudgesScoring />} />
            <Route path="judges/scoring" element={<LiveJudgesScoring />} />
          </Route>

          {/* Station Lead Controls */}
          <Route path="/station-lead" element={<StationLeadView />} />
          <Route path="/station/:stationId" element={<StationDetail />} />

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