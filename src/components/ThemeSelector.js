import React, { useState, useEffect } from 'react';

const ThemeSelector = ({ isOpen, onClose }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  const themes = {
    default: {
      name: 'Default',
      colors: {
        '--primary-color': '#4a90e2',
        '--secondary-color': '#f4f4f9',
        '--background-color': '#ffffff',
        '--text-color': '#333333',
        '--border-color': '#e0e0e0',
        '--danger-color': '#ff4d4d',
        '--success-color': '#28a745'
      }
    },
    dark: {
      name: 'Dark Mode',
      colors: {
        '--primary-color': '#bb86fc',
        '--secondary-color': '#121212',
        '--background-color': '#1e1e1e',
        '--text-color': '#ffffff',
        '--border-color': '#333333',
        '--danger-color': '#cf6679',
        '--success-color': '#03dac6'
      }
    },
    ocean: {
      name: 'Ocean Blue',
      colors: {
        '--primary-color': '#0984e3',
        '--secondary-color': '#e8f4fd',
        '--background-color': '#f8fcff',
        '--text-color': '#2d3436',
        '--border-color': '#b3d9f2',
        '--danger-color': '#e74c3c',
        '--success-color': '#00b894'
      }
    },
    neon: {
      name: 'Neon Cyber',
      colors: {
        '--primary-color': '#00ff88',
        '--secondary-color': '#0a0a0a',
        '--background-color': '#111111',
        '--text-color': '#00ff88',
        '--border-color': '#00ff88',
        '--danger-color': '#ff0055',
        '--success-color': '#00ff88'
      }
    },
    purple: {
      name: 'Royal Purple',
      colors: {
        '--primary-color': '#8e44ad',
        '--secondary-color': '#f4f1f8',
        '--background-color': '#faf9fc',
        '--text-color': '#2c3e50',
        '--border-color': '#d1c4e9',
        '--danger-color': '#e74c3c',
        '--success-color': '#27ae60'
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('taskManagerTheme') || 'default';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    if (theme) {
      Object.entries(theme.colors).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
      localStorage.setItem('taskManagerTheme', themeName);
    }
  };

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    applyTheme(themeName);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content theme-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>🎨 Choose Theme</h2>
        
        <div className="theme-grid">
          {Object.entries(themes).map(([key, theme]) => (
            <div 
              key={key}
              className={`theme-option ${currentTheme === key ? 'active' : ''}`}
              onClick={() => handleThemeChange(key)}
            >
              <div className="theme-preview" style={{ backgroundColor: theme.colors['--primary-color'] }}>
                <div className="theme-preview-bg" style={{ backgroundColor: theme.colors['--background-color'] }}>
                  <div className="theme-preview-text" style={{ color: theme.colors['--text-color'] }}>Aa</div>
                </div>
              </div>
              <span>{theme.name}</span>
              {currentTheme === key && <i className="fas fa-check"></i>}
            </div>
          ))}
        </div>

        <div className="theme-options">
          <h3>Background Options</h3>
          <label>
            <input 
              type="checkbox" 
              onChange={(e) => {
                const videoEl = document.querySelector('.video-background');
                const overlayEl = document.querySelector('.video-overlay');
                if (videoEl && overlayEl) {
                  videoEl.style.display = e.target.checked ? 'block' : 'none';
                  overlayEl.style.display = e.target.checked ? 'block' : 'none';
                }
                localStorage.setItem('showVideoBackground', e.target.checked);
              }}
              defaultChecked={localStorage.getItem('showVideoBackground') !== 'false'}
            />
            Show video background
          </label>
          <label>
            <input 
              type="range" 
              min="0" 
              max="0.8" 
              step="0.1" 
              defaultValue="0.4"
              onChange={(e) => {
                const overlayEl = document.querySelector('.video-overlay');
                if (overlayEl) {
                  overlayEl.style.background = `rgba(0, 0, 0, ${e.target.value})`;
                }
                localStorage.setItem('videoOpacity', e.target.value);
              }}
            />
            Video overlay opacity
          </label>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;