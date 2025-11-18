import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <div className="loading-text">Loading Task Manager...</div>
      </div>
    </div>
  );
};

export default Loading;