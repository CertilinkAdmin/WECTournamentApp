import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  totalCompetitors: number;
  totalJudges: number;
  totalStations: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<TournamentStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    totalCompetitors: 0,
    totalJudges: 0,
    totalStations: 0
  });

  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setStats({
        totalTournaments: 3,
        activeTournaments: 1,
        totalCompetitors: 24,
        totalJudges: 12,
        totalStations: 4
      });

      setRecentTournaments([
        {
          id: 1,
          name: 'WEC 2025 Milano',
          status: 'ACTIVE',
          competitors: 24,
          judges: 12,
          startDate: '2025-01-15',
          currentRound: 3
        },
        {
          id: 2,
          name: 'Regional Championship',
          status: 'COMPLETED',
          competitors: 16,
          judges: 8,
          startDate: '2024-12-10',
          currentRound: 5
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const quickActions = [
    {
      title: 'Create Tournament',
      description: 'Start a new tournament',
      icon: '/icons/trophy.png',
      link: '/admin/tournaments/create',
      color: 'primary'
    },
    {
      title: 'Manage Competitors',
      description: 'Add or edit competitors',
      icon: '/icons/briefcase.png',
      link: '/admin/competitors',
      color: 'green'
    },
    {
      title: 'Assign Judges',
      description: 'Manage judge assignments',
      icon: '/icons/stopwatch.png',
      link: '/admin/judges',
      color: 'purple'
    },
    {
      title: 'Setup Stations',
      description: 'Configure tournament stations',
      icon: '/icons/coffepot.png',
      link: '/admin/stations',
      color: 'orange'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tournament Dashboard</h1>
        <p className="dashboard-subtitle">Manage your tournaments and monitor progress</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/bean n leaf.png" alt="Total Tournaments" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalTournaments}</div>
            <div className="stat-label">Total Tournaments</div>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon">
            <img src="/icons/headset.png" alt="Active Tournaments" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.activeTournaments}</div>
            <div className="stat-label">Active Tournaments</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/ChatGPT Image Oct 29, 2025, 04_43_32 PM 2.png" alt="Competitors" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalCompetitors}</div>
            <div className="stat-label">Competitors</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/handcheck.png" alt="Judges" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalJudges}</div>
            <div className="stat-label">Judges</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/coffee tap.png" alt="Stations" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalStations}</div>
            <div className="stat-label">Stations</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                to={action.link} 
                className={`quick-action-card ${action.color}`}
              >
                <div className="action-icon">
                  <img src={action.icon} alt={action.title} />
                </div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tournaments */}
        <div className="dashboard-section">
          <h2 className="section-title">Recent Tournaments</h2>
          <div className="tournaments-list">
            {recentTournaments.map((tournament) => (
              <div key={tournament.id} className="tournament-card">
                <div className="tournament-header">
                  <h3 className="tournament-name">{tournament.name}</h3>
                  <span className={`tournament-status ${tournament.status.toLowerCase()}`}>
                    {tournament.status}
                  </span>
                </div>
                <div className="tournament-details">
                  <div className="detail-item">
                    <span className="detail-label">Competitors:</span>
                    <span className="detail-value">{tournament.competitors}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Judges:</span>
                    <span className="detail-value">{tournament.judges}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Round:</span>
                    <span className="detail-value">{tournament.currentRound}</span>
                  </div>
                </div>
                <div className="tournament-actions">
                  <Link to={`/admin/tournaments/${tournament.id}/edit`} className="action-btn">
                    Edit
                  </Link>
                  <Link to={`/live/tournament/${tournament.id}`} className="action-btn primary">
                    View Live
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
