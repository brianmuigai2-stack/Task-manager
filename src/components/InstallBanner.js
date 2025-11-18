import React, { useState, useEffect } from 'react';
import './InstallBanner.css';

const InstallBanner = ({ deferredPrompt, onInstall }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://');
      setIsStandalone(isStandalone);
    };

    checkStandalone();

    // Show banner if not standalone (always show for web version)
    if (!isStandalone) {
      setIsVisible(true);
    }
  }, [deferredPrompt]);

  const handleInstall = () => {
    if (deferredPrompt) {
      onInstall();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  // Don't show if dismissed before
  if (localStorage.getItem('installBannerDismissed') && !isStandalone) {
    return null;
  }

  // Show banner if visible (deferredPrompt available) or if not standalone (web version)
  if (!isVisible && isStandalone) return null;

  return (
    <div className={`install-banner ${isStandalone ? 'standalone' : ''}`}>
      <div className="banner-content">
        <div className="banner-icon">
          <i className="fas fa-mobile-alt"></i>
        </div>
        <div className="banner-text">
          {isStandalone ? (
            <>
              <strong>You're using Task Manager App!</strong>
              <span>Enjoy the full experience</span>
            </>
          ) : deferredPrompt ? (
            <>
              <strong>Install Task Manager</strong>
              <span>Get the app for offline access and better experience</span>
            </>
          ) : (
            <>
              <strong>Add to Home Screen</strong>
              <span>Use your browser's "Add to Home Screen" option</span>
            </>
          )}
        </div>
        <div className="banner-actions">
          {isStandalone ? (
            <button className="banner-btn secondary" onClick={() => setIsVisible(false)}>
              <i className="fas fa-times"></i>
            </button>
          ) : deferredPrompt ? (
            <>
              <button className="banner-btn primary" onClick={handleInstall}>
                Install
              </button>
              <button className="banner-btn secondary" onClick={handleDismiss}>
                <i className="fas fa-times"></i>
              </button>
            </>
          ) : (
            <button className="banner-btn secondary" onClick={handleDismiss}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;