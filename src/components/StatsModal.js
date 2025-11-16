import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const StatsModal = ({ isOpen, onClose, tasks, userDoc }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (tasks.length > 0) {
      calculateStats();
    }
  }, [tasks]);

  const calculateStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const categoryStats = {};
    const priorityStats = { high: 0, medium: 0, low: 0 };
    
    tasks.forEach(task => {
      if (task.category) {
        categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
      }
      priorityStats[task.priority] = (priorityStats[task.priority] || 0) + 1;
    });

    const weeklyProgress = getWeeklyProgress();
    
    setStats({
      total,
      completed,
      completionRate,
      categoryStats,
      priorityStats,
      weeklyProgress,
      streak: calculateStreak(),
      level: Math.floor(completed / 10) + 1,
      xp: (completed * 10) % 100
    });
  };

  const getWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const progress = days.map(() => 0);
    
    tasks.filter(t => t.completed).forEach(task => {
      if (task.completedAt) {
        const day = new Date(task.completedAt.seconds * 1000).getDay();
        progress[day === 0 ? 6 : day - 1]++;
      }
    });
    
    return { labels: days, data: progress };
  };

  const calculateStreak = () => {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt)
      .sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let task of completedTasks) {
      const taskDate = new Date(task.completedAt.seconds * 1000);
      taskDate.setHours(0, 0, 0, 0);
      
      if (taskDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const pieData = {
    labels: Object.keys(stats.categoryStats || {}),
    datasets: [{
      data: Object.values(stats.categoryStats || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
    }]
  };

  const barData = {
    labels: stats.weeklyProgress?.labels || [],
    datasets: [{
      label: 'Tasks Completed',
      data: stats.weeklyProgress?.data || [],
      backgroundColor: '#4a90e2'
    }]
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content stats-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>📊 Your Stats</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>🎯 Completion Rate</h3>
            <div className="stat-value">{stats.completionRate}%</div>
            <p>{stats.completed} of {stats.total} tasks</p>
          </div>
          
          <div className="stat-card">
            <h3>🔥 Current Streak</h3>
            <div className="stat-value">{stats.streak}</div>
            <p>days in a row</p>
          </div>
          
          <div className="stat-card">
            <h3>⭐ Level</h3>
            <div className="stat-value">{stats.level}</div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${stats.xp}%` }}></div>
            </div>
            <p>{stats.xp}/100 XP</p>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-section">
            <h3>Tasks by Category</h3>
            {Object.keys(stats.categoryStats || {}).length > 0 ? (
              <Pie data={pieData} />
            ) : (
              <p>No category data available</p>
            )}
          </div>
          
          <div className="chart-section">
            <h3>Weekly Progress</h3>
            <Bar data={barData} />
          </div>
        </div>

        <div className="achievements">
          <h3>🏆 Achievements</h3>
          <div className="achievement-list">
            {stats.completed >= 1 && <span className="achievement">🎉 First Task</span>}
            {stats.completed >= 10 && <span className="achievement">💪 Task Master</span>}
            {stats.completed >= 50 && <span className="achievement">🚀 Productivity Pro</span>}
            {stats.streak >= 7 && <span className="achievement">🔥 Week Warrior</span>}
            {stats.completionRate >= 80 && <span className="achievement">⭐ Efficiency Expert</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;