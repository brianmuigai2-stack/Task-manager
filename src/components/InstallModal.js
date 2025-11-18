import React from 'react';
import './InstallModal.css';

const InstallModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content install-instructions-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>How to Install Task Manager</h2>

        {isIOS ? (
          <div className="install-steps">
            <h3>iOS Safari Installation:</h3>
            <ol>
              <li>Tap the Share button <i className="fas fa-share"></i></li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right</li>
              <li>The app will appear on your home screen</li>
            </ol>
          </div>
        ) : isAndroid ? (
          <div className="install-steps">
            <h3>Android Chrome Installation:</h3>
            <ol>
              <li>Tap the menu button <i className="fas fa-ellipsis-v"></i></li>
              <li>Tap "Install app" or "Add to Home Screen"</li>
              <li>Tap "Install"</li>
              <li>The app will appear on your home screen</li>
            </ol>
          </div>
        ) : (
          <div className="install-steps">
            <h3>Desktop/Other Browsers:</h3>
            <ol>
              <li>Look for the install icon in the address bar</li>
              <li>Or click the menu button and select "Install"</li>
              <li>Follow the browser's installation prompts</li>
            </ol>
          </div>
        )}

        <div className="install-note">
          <p><strong>Note:</strong> This is a Progressive Web App (PWA) that installs through your browser, not through app stores.</p>
        </div>

        <button className="btn btn-primary" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
};

export default InstallModal;