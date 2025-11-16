import React, { useState } from 'react';

const WelcomeModal = ({ isOpen, onClose, onLoadDemo, userName }) => {
  const [step, setStep] = useState(1);

  const features = [
    {
      icon: '🍅',
      title: 'Pomodoro Timer',
      description: 'Focus with 25-minute work sessions and built-in breaks'
    },
    {
      icon: '📊',
      title: 'Analytics & Stats',
      description: 'Track your productivity with detailed charts and insights'
    },
    {
      icon: '🎨',
      title: 'Beautiful Themes',
      description: 'Customize your experience with 5 stunning color schemes'
    },
    {
      icon: '👥',
      title: 'Social Features',
      description: 'Connect with friends and share tasks for collaboration'
    },
    {
      icon: '⌨️',
      title: 'Keyboard Shortcuts',
      description: 'Power user shortcuts for lightning-fast task management'
    },
    {
      icon: '🏆',
      title: 'Gamification',
      description: 'Earn XP, level up, and unlock achievements as you complete tasks'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content welcome-modal">
        {step === 1 && (
          <>
            <h1>🎉 Welcome to Ultimate Task Manager!</h1>
            <p>Hi <strong>{userName}</strong>! Ready to supercharge your productivity?</p>
            
            <div className="welcome-options">
              <button 
                className="btn btn-primary welcome-btn"
                onClick={() => {
                  onLoadDemo();
                  setStep(2);
                }}
              >
                🚀 Load Demo Tasks
                <small>See the app in action with sample tasks</small>
              </button>
              
              <button 
                className="btn btn-secondary welcome-btn"
                onClick={() => setStep(2)}
              >
                ✨ Start Fresh
                <small>Begin with a clean slate</small>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>🌟 Amazing Features Await You!</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
            
            <div className="welcome-shortcuts">
              <h3>⚡ Quick Shortcuts</h3>
              <div className="shortcuts-list">
                <span><kbd>Ctrl+N</kbd> New Task</span>
                <span><kbd>Ctrl+P</kbd> Pomodoro</span>
                <span><kbd>Ctrl+S</kbd> Stats</span>
                <span><kbd>Ctrl+T</kbd> Themes</span>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              🎯 Let's Get Started!
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomeModal;