import React, { useState, useEffect } from 'react';

const PomodoroTimer = ({ isOpen, onClose, currentTask }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak

  const modes = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playAlarm();
      showNotification();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const playAlarm = () => {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    audio.volume = 0.8;
    audio.play().catch(() => {});
    
    // Play multiple times for better alarm effect
    setTimeout(() => audio.play().catch(() => {}), 500);
    setTimeout(() => audio.play().catch(() => {}), 1000);
    setTimeout(() => audio.play().catch(() => {}), 1500);
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer Complete!', {
        body: mode === 'work' ? 'Time for a break!' : 'Time to get back to work!',
        icon: '/favicon.ico',
        tag: 'pomodoro'
      });
    }
    
    // Visual alert
    document.body.style.animation = 'flash 0.5s ease-in-out 3';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 1500);
  };

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode]);
    setIsRunning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content pomodoro-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>🍅 Pomodoro Timer</h2>
        {currentTask && <p>Working on: <strong>{currentTask.text}</strong></p>}
        
        <div className="pomodoro-modes">
          <button 
            className={`mode-btn ${mode === 'work' ? 'active' : ''}`}
            onClick={() => switchMode('work')}
          >
            Work
          </button>
          <button 
            className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
            onClick={() => switchMode('shortBreak')}
          >
            Short Break
          </button>
          <button 
            className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
            onClick={() => switchMode('longBreak')}
          >
            Long Break
          </button>
        </div>

        <div className={`timer-display ${timeLeft <= 60 && isRunning ? 'urgent' : ''}`}>
          {formatTime(timeLeft)}
          {timeLeft <= 10 && isRunning && (
            <div className="urgent-indicator">⚠️</div>
          )}
        </div>

        <div className="timer-controls">
          <button 
            className="btn btn-primary"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setTimeLeft(modes[mode]);
              setIsRunning(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;